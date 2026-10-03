import * as React from "react"
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView as RNScrollView,
} from "react-native"
import { ScrollView, useTw, View } from "@astrawind/css"
import { ArrowDownIcon } from "lucide-react-native"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Icon } from "./icon"

/*
 * Native re-implementation of `@shadcn/react/message-scroller`, the headless
 * scroll manager behind shadcn's chat UI:
 *
 * - `defaultScrollPosition` ("end" | "start" | "last-anchor") is applied once the
 *   first items have been laid out; the viewport stays invisible until then.
 * - With `autoScroll`, the viewport follows new content while it is at the
 *   bottom ("following-bottom") and stops following once the user scrolls up.
 * - Items with `scrollAnchor` (e.g. a sent user message) are scrolled to the
 *   top of the viewport when they are added, leaving `scrollPreviousItemPeek`
 *   of the previous item visible. A spacer below the content makes room for
 *   that while the response streams in.
 * - Prepending items keeps the visible items in place (`preserveScrollOnPrepend`).
 * - `MessageScrollerButton` appears when there's content past the edge and
 *   scrolls to it.
 *
 * Item positions come from `onLayout`, so `MessageScrollerItem`s must be direct
 * children of `MessageScrollerContent`.
 */

const EDGE_THRESHOLD = 8
const PREVIOUS_ITEM_PEEK = 64
const SCROLL_MARGIN = 0
const EPSILON = 0.5
const AUTOSCROLL_MS = 180

type MessageScrollerDefaultScrollPosition = "start" | "end" | "last-anchor"
type MessageScrollerButtonDirection = "start" | "end"
type MessageScrollerScrollAlign = "start" | "center" | "end" | "nearest"
type MessageScrollerScrollOptions = {
  align?: MessageScrollerScrollAlign
  behavior?: "auto" | "smooth" | "instant"
  scrollMargin?: number
}
type MessageScrollerScrollable = { start: boolean; end: boolean }
type MessageScrollerVisibilityState = { currentAnchorId: string | null; visibleMessageIds: string[] }

type Mode = "following-bottom" | "free-scrolling" | "anchored-to-message" | "settling-jump"

// ---------------------------------------------------------------------------
// Tiny external store (subscribed with useSyncExternalStore)
// ---------------------------------------------------------------------------

function createStore<T>(initial: T, equal: (a: T, b: T) => boolean) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (next: T) => {
      if (equal(value, next)) return
      value = next
      listeners.forEach((l) => l())
    },
    hasListeners: () => listeners.size > 0,
    subscribe: (listener: () => void, onFirst?: () => void) => {
      listeners.add(listener)
      if (listeners.size === 1) onFirst?.()
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

const NO_EDGES: MessageScrollerScrollable = { start: false, end: false }
const NO_VISIBILITY: MessageScrollerVisibilityState = { currentAnchorId: null, visibleMessageIds: [] }

const sameEdges = (a: MessageScrollerScrollable, b: MessageScrollerScrollable) => a.start === b.start && a.end === b.end
const sameVisibility = (a: MessageScrollerVisibilityState, b: MessageScrollerVisibilityState) =>
  a.currentAnchorId === b.currentAnchorId &&
  a.visibleMessageIds.length === b.visibleMessageIds.length &&
  a.visibleMessageIds.every((id, i) => id === b.visibleMessageIds[i])

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

interface ItemRecord {
  key: string
  messageId?: string
  anchor: boolean
  y?: number
  height?: number
}

type LaidOutItem = ItemRecord & { y: number; height: number }

interface EngineOptions {
  autoScroll: boolean
  defaultScrollPosition: MessageScrollerDefaultScrollPosition
  scrollEdgeThreshold: number
  scrollPreviousItemPeek: number
  scrollMargin: number
}

const animatedFor = (behavior: MessageScrollerScrollOptions["behavior"]) => behavior === "smooth"

class MessageScrollerEngine {
  options: EngineOptions
  scrollView: RNScrollView | null = null
  preserveScrollOnPrepend = true

  // Geometry
  viewportHeight = 0
  scrollY = 0
  lastScrollY = 0
  contentHeight = 0
  contentOffsetY = 0
  contentPaddingBottom = 0
  spacerGap = 0
  items = new Map<string, ItemRecord>()

  // Behaviour
  mode: Mode
  anchoredKey: string | null = null
  autoscrolling = false
  autoscrollTimer: ReturnType<typeof setTimeout> | null = null
  defaultApplied = false
  knownKeys = new Set<string>()
  handledAnchors = new Set<string>()
  topItem: { key: string; viewportTop: number } | null = null
  pendingScroll: { y: number; animated: boolean } | null = null
  pendingTimer: ReturnType<typeof setTimeout> | null = null
  pendingScrollToMessage: { messageId: string; options?: MessageScrollerScrollOptions } | null = null
  frame: number | null = null

  // Stores
  edges = createStore(NO_EDGES, sameEdges)
  visibility = createStore(NO_VISIBILITY, sameVisibility)
  spacer = createStore<number>(0, Object.is)
  pendingDefault: ReturnType<typeof createStore<boolean>>

  constructor(options: EngineOptions) {
    this.options = options
    this.mode = options.autoScroll ? "following-bottom" : "free-scrolling"
    this.pendingDefault = createStore(options.defaultScrollPosition !== "start", Object.is)
  }

  // --- geometry helpers ----------------------------------------------------

  /** Items ordered top to bottom, or null while some are not laid out yet. */
  orderedItems(): LaidOutItem[] | null {
    const list = [...this.items.values()]
    if (list.some((i) => i.y === undefined || i.height === undefined)) return null
    return (list as LaidOutItem[]).sort((a, b) => a.y - b.y)
  }

  itemTop(item: ItemRecord) {
    return this.contentOffsetY + (item.y ?? 0)
  }

  /** Bottom of the real content (excluding the spacer), in scroll coordinates. */
  contentBottom() {
    let bottom = 0
    for (const i of this.items.values()) {
      if (i.y !== undefined) bottom = Math.max(bottom, this.itemTop(i) + (i.height ?? 0))
    }
    if (bottom === 0) return Math.max(0, this.contentHeight - this.spacer.get())
    return bottom + this.contentPaddingBottom
  }

  maxScroll() {
    return Math.max(0, this.contentBottom() - this.viewportHeight)
  }

  computeEdges(): MessageScrollerScrollable {
    if (!this.viewportHeight) return NO_EDGES
    const t = this.options.scrollEdgeThreshold
    return {
      start: this.scrollY > t,
      end: this.contentBottom() - this.scrollY - this.viewportHeight > t,
    }
  }

  // --- state commits -------------------------------------------------------

  commit = () => {
    const edges = this.computeEdges()
    this.edges.set(this.mode === "following-bottom" ? { ...edges, end: false } : edges)
    this.syncVisibility()
    this.recordTopItem()
  }

  syncVisibility() {
    if (!this.visibility.hasListeners()) return
    const top = this.scrollY + this.options.scrollMargin + this.options.scrollPreviousItemPeek
    const bottom = this.scrollY + this.viewportHeight
    const visible: string[] = []
    let current: string | null = null
    const ordered = [...this.items.values()]
      .filter((i) => i.y !== undefined)
      .sort((a, b) => a.y! - b.y!)
    for (const i of ordered) {
      const t = this.itemTop(i)
      const b = t + (i.height ?? 0)
      if (i.messageId && b > top && t < bottom) visible.push(i.messageId)
      if (i.anchor && i.messageId && t <= top + EPSILON) current = i.messageId
    }
    this.visibility.set(
      visible.length === 0 && current === null ? NO_VISIBILITY : { currentAnchorId: current, visibleMessageIds: visible }
    )
  }

  /** Remembers the first visible item so prepends can keep it in place. */
  recordTopItem() {
    const ordered = this.orderedItems()
    if (!ordered) return
    const first = ordered.find((i) => this.itemTop(i) + i.height > this.scrollY)
    this.topItem = first ? { key: first.key, viewportTop: this.itemTop(first) - this.scrollY } : null
  }

  setAutoscrolling(on: boolean) {
    if (this.autoscrollTimer) clearTimeout(this.autoscrollTimer)
    this.autoscrollTimer = null
    this.autoscrolling = on
    if (on) {
      this.autoscrollTimer = setTimeout(() => {
        this.autoscrollTimer = null
        this.autoscrolling = false
        this.commit()
      }, AUTOSCROLL_MS)
    }
  }

  // --- scrolling -----------------------------------------------------------

  setSpacer(height: number) {
    this.spacer.set(Math.max(0, Math.ceil(height)))
  }

  scrollTo(y: number, { animated = false, autoscrolling = false } = {}) {
    const target = Math.max(0, y)
    if (Math.abs(this.scrollY - target) <= EPSILON) {
      this.pendingScroll = null
      this.revealDefault()
      this.commit()
      return
    }
    // Wait for the ScrollView to grow (e.g. after a spacer change) before scrolling.
    const needed = target + this.viewportHeight
    if (this.contentHeight + EPSILON < needed) {
      this.pendingScroll = { y: target, animated }
      if (autoscrolling) this.setAutoscrolling(true)
      // If the content never reaches the estimated size, settle for its end.
      if (this.pendingTimer) clearTimeout(this.pendingTimer)
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null
        const p = this.pendingScroll
        if (!p) return
        this.pendingScroll = null
        this.scrollView?.scrollTo({ y: Math.max(0, Math.min(p.y, this.contentHeight - this.viewportHeight)), animated: p.animated })
        this.defaultApplied = true
        this.revealDefault()
        this.scheduleCommit()
      }, 150)
      return
    }
    this.pendingScroll = null
    if (this.pendingTimer) clearTimeout(this.pendingTimer)
    this.pendingTimer = null
    if (autoscrolling || animated) this.setAutoscrolling(true)
    this.scrollView?.scrollTo({ y: target, animated })
    if (!animated) {
      // onScroll isn't guaranteed for non-animated jumps on every platform.
      this.scrollY = this.lastScrollY = target
    }
    this.revealDefault()
    this.scheduleCommit()
  }

  flushPendingScroll() {
    const p = this.pendingScroll
    if (p && this.contentHeight + EPSILON >= p.y + this.viewportHeight) this.scrollTo(p.y, { animated: p.animated })
  }

  revealDefault() {
    if (this.pendingDefault.get() && this.defaultApplied) {
      requestAnimationFrame(() => this.pendingDefault.set(false))
    }
  }

  scrollToStart = ({ behavior = "auto" }: MessageScrollerScrollOptions = {}) => {
    if (!this.scrollView) return false
    this.setSpacer(0)
    this.anchoredKey = null
    this.mode = "free-scrolling"
    this.scrollTo(0, { animated: animatedFor(behavior) })
    return true
  }

  scrollToEnd = ({ behavior = "auto" }: MessageScrollerScrollOptions = {}) => {
    if (!this.scrollView) return false
    this.setSpacer(0)
    this.anchoredKey = null
    this.mode = this.options.autoScroll ? "following-bottom" : "free-scrolling"
    this.scrollTo(this.maxScroll(), { animated: animatedFor(behavior), autoscrolling: true })
    return true
  }

  scrollToItem(
    item: ItemRecord,
    { align = "start", behavior = "auto", scrollMargin = this.options.scrollMargin }: MessageScrollerScrollOptions = {},
    { keepPreviousPeek = false } = {}
  ) {
    if (!this.scrollView || item.y === undefined) return false
    const margin = keepPreviousPeek ? scrollMargin + this.options.scrollPreviousItemPeek : scrollMargin
    const top = this.itemTop(item)
    const h = item.height ?? 0
    const vh = this.viewportHeight
    let target: number
    if (align === "center") target = top - (vh - h) / 2 - margin
    else if (align === "end") target = top - vh + h + margin
    else if (align === "nearest") {
      const visibleTop = this.scrollY
      const visibleBottom = this.scrollY + vh
      target =
        top >= visibleTop && top + h <= visibleBottom
          ? this.scrollY
          : top < visibleTop
            ? top - margin
            : top + h - vh + margin
    } else target = top - margin
    target = Math.max(0, target)
    this.setSpacer(target + vh - this.contentBottom())
    this.mode = keepPreviousPeek ? "anchored-to-message" : "settling-jump"
    this.anchoredKey = keepPreviousPeek ? item.key : null
    this.scrollTo(target, { animated: animatedFor(behavior) })
    return true
  }

  scrollToMessage = (messageId: string, options?: MessageScrollerScrollOptions) => {
    const item = [...this.items.values()].find((i) => i.messageId === messageId)
    if (item && item.y !== undefined) {
      this.defaultApplied = true
      this.pendingScrollToMessage = null
      return this.scrollToItem(item, options)
    }
    if (item || this.items.size === 0) {
      this.pendingScrollToMessage = { messageId, options }
      return true
    }
    return false
  }

  // --- events --------------------------------------------------------------

  scheduleCommit() {
    if (this.frame !== null) return
    this.frame = requestAnimationFrame(() => {
      this.frame = null
      this.commit()
    })
  }

  contentFrame: number | null = null
  scheduleContentChange() {
    if (this.contentFrame !== null) return
    this.contentFrame = requestAnimationFrame(() => {
      this.contentFrame = null
      this.handleContentChange()
    })
  }

  onScroll(y: number) {
    this.scrollY = y
    const scrolledUp = y < this.lastScrollY - EPSILON
    this.lastScrollY = y
    const edges = this.computeEdges()
    if (this.options.autoScroll && !edges.end && this.mode !== "settling-jump" && this.mode !== "anchored-to-message") {
      this.mode = "following-bottom"
    } else if (this.mode === "following-bottom" && edges.end && scrolledUp && !this.autoscrolling) {
      this.mode = "free-scrolling"
    }
    this.commit()
  }

  userScrollIntent() {
    if (this.mode !== "free-scrolling") {
      this.anchoredKey = null
      this.mode = "free-scrolling"
    }
  }

  applyDefaultPosition(ordered: ItemRecord[]) {
    const pos = this.options.defaultScrollPosition
    this.defaultApplied = true
    if (pos === "start") {
      this.pendingDefault.set(false)
      this.scrollToStart()
      return
    }
    if (pos === "last-anchor") {
      const anchor = [...ordered].reverse().find((i) => i.anchor)
      if (anchor && this.contentBottom() - this.itemTop(anchor) > this.viewportHeight) {
        this.scrollToItem(anchor, { align: "start" }, { keepPreviousPeek: true })
        return
      }
    }
    this.scrollToEnd()
  }

  handleContentChange() {
    this.flushPendingScroll()
    if (!this.viewportHeight) return
    const ordered = this.orderedItems()
    if (!ordered) return // wait for all items to be laid out

    if (this.pendingScrollToMessage) {
      const { messageId, options } = this.pendingScrollToMessage
      if (ordered.some((i) => i.messageId === messageId)) {
        this.scrollToMessage(messageId, options)
        this.markKnown(ordered)
        return
      }
    }

    if (!this.defaultApplied) {
      if (ordered.length === 0) {
        this.pendingDefault.set(false)
        this.commit()
        return
      }
      this.markKnown(ordered)
      for (const i of ordered) if (i.anchor) this.handledAnchors.add(i.key)
      this.applyDefaultPosition(ordered)
      return
    }

    const added = ordered.filter((i) => !this.knownKeys.has(i.key))
    const hadItems = this.knownKeys.size > 0
    const previousTop = this.topItem
    this.markKnown(ordered)

    if (added.length && hadItems) {
      const firstOld = ordered.find((i) => !added.includes(i))
      const prepended = firstOld ? added.every((i) => i.y! < firstOld.y!) : false
      if (prepended) {
        // Keep the item that was at the top of the viewport where it was.
        if (this.preserveScrollOnPrepend && previousTop) {
          const item = this.items.get(previousTop.key)
          if (item) {
            const delta = this.itemTop(item) - this.scrollY - previousTop.viewportTop
            if (Math.abs(delta) > EPSILON) this.scrollTo(this.scrollY + delta)
          }
        }
        this.commit()
        return
      }
      const anchors = added.filter((i) => i.anchor && !this.handledAnchors.has(i.key))
      if (anchors.length) {
        anchors.forEach((a) => this.handledAnchors.add(a.key))
        if (this.options.autoScroll && this.mode === "following-bottom" && anchors.length > 1) {
          this.scrollToEnd()
        } else {
          this.scrollToItem(anchors[0], { align: "start" }, { keepPreviousPeek: true })
        }
        return
      }
    } else if (added.length && !hadItems) {
      for (const i of added) if (i.anchor) this.handledAnchors.add(i.key)
      if (this.options.autoScroll) {
        this.scrollToEnd()
        return
      }
    }

    // Size changes (e.g. a streaming response).
    if (this.mode === "following-bottom" && this.options.autoScroll) {
      this.scrollToEnd()
      return
    }
    if (this.mode === "anchored-to-message" && this.anchoredKey) {
      const item = this.items.get(this.anchoredKey)
      const hadSpacer = this.spacer.get() > 0
      if (item) {
        this.scrollToItem(item, { align: "start" }, { keepPreviousPeek: true })
        // Once the response fills the viewport, start following it.
        if (this.options.autoScroll && hadSpacer && this.spacer.get() === 0) this.scrollToEnd()
        return
      }
    }
    this.commit()
  }

  markKnown(ordered: ItemRecord[]) {
    this.knownKeys = new Set(ordered.map((i) => i.key))
  }

  // --- registration --------------------------------------------------------

  registerItem(key: string) {
    this.items.set(key, { key, anchor: false })
    return () => {
      this.items.delete(key)
      this.knownKeys.delete(key)
      if (this.anchoredKey === key) this.anchoredKey = null
      this.scheduleContentChange()
    }
  }

  updateItem(key: string, messageId: string | undefined, anchor: boolean) {
    const item = this.items.get(key)
    if (!item) return
    item.messageId = messageId
    item.anchor = anchor
    if (messageId !== undefined && this.pendingScrollToMessage?.messageId === messageId) this.scheduleContentChange()
  }

  setItemLayout(key: string, y: number, height: number) {
    const item = this.items.get(key)
    if (!item) return
    if (item.y === y && item.height === height) return
    item.y = y
    item.height = height
    this.scheduleContentChange()
  }

  dispose() {
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    if (this.contentFrame !== null) cancelAnimationFrame(this.contentFrame)
    if (this.autoscrollTimer) clearTimeout(this.autoscrollTimer)
    if (this.pendingTimer) clearTimeout(this.pendingTimer)
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const MessageScrollerContext = React.createContext<MessageScrollerEngine | null>(null)

function useEngine(component: string) {
  const engine = React.useContext(MessageScrollerContext)
  if (!engine) throw new Error(`${component} must be used within a MessageScroller.`)
  return engine
}

function useStore<T>(store: { get: () => T; subscribe: (l: () => void, onFirst?: () => void) => () => void }, onFirst?: () => void) {
  const subscribe = React.useCallback((l: () => void) => store.subscribe(l, onFirst), [store, onFirst])
  return React.useSyncExternalStore(subscribe, store.get, store.get)
}

type MessageScrollerProviderProps = {
  children?: React.ReactNode
  autoScroll?: boolean
  defaultScrollPosition?: MessageScrollerDefaultScrollPosition
  scrollEdgeThreshold?: number
  scrollPreviousItemPeek?: number
  scrollMargin?: number
}

function MessageScrollerProvider({
  children,
  autoScroll = false,
  defaultScrollPosition = "end",
  scrollEdgeThreshold = EDGE_THRESHOLD,
  scrollPreviousItemPeek = PREVIOUS_ITEM_PEEK,
  scrollMargin = SCROLL_MARGIN,
}: MessageScrollerProviderProps) {
  const options: EngineOptions = { autoScroll, defaultScrollPosition, scrollEdgeThreshold, scrollPreviousItemPeek, scrollMargin }
  const [engine] = React.useState(() => new MessageScrollerEngine(options))
  const previousDefault = React.useRef(defaultScrollPosition)
  if (previousDefault.current !== defaultScrollPosition) {
    previousDefault.current = defaultScrollPosition
    engine.defaultApplied = false
  }
  engine.options = options
  React.useEffect(() => () => engine.dispose(), [engine])
  // Turning autoScroll on while at the bottom starts following immediately.
  React.useEffect(() => {
    if (autoScroll && engine.mode === "following-bottom" && engine.items.size > 0) engine.scrollToEnd()
    else engine.commit()
  }, [autoScroll, engine])
  return <MessageScrollerContext.Provider value={engine}>{children}</MessageScrollerContext.Provider>
}

/** Scroll commands: `scrollToEnd`, `scrollToStart`, `scrollToMessage(id)`. */
function useMessageScroller() {
  const engine = useEngine("useMessageScroller")
  return React.useMemo(
    () => ({
      scrollToEnd: engine.scrollToEnd,
      scrollToMessage: engine.scrollToMessage,
      scrollToStart: engine.scrollToStart,
    }),
    [engine]
  )
}

/** Whether there is content before (`start`) or after (`end`) the viewport. */
function useMessageScrollerScrollable(): MessageScrollerScrollable {
  return useStore(useEngine("useMessageScrollerScrollable").edges)
}

/** Message ids in view and the current scroll anchor. */
function useMessageScrollerVisibility(): MessageScrollerVisibilityState {
  const engine = useEngine("useMessageScrollerVisibility")
  const onFirst = React.useCallback(() => engine.syncVisibility(), [engine])
  return useStore(engine.visibility, onFirst)
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

type ViewProps = React.ComponentProps<typeof View>

function MessageScrollerRoot({ className, ...props }: ViewProps) {
  const engine = useEngine("MessageScroller")
  const pending = useStore(engine.pendingDefault)
  return (
    <View
      data-slot="message-scroller"
      data-pending-scroll={pending || undefined}
      className={cn("group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden", className)}
      {...props}
    />
  )
}

/** Wraps itself in a MessageScrollerProvider when none is present. */
function MessageScroller(props: ViewProps) {
  const engine = React.useContext(MessageScrollerContext)
  if (engine) return <MessageScrollerRoot {...props} />
  return (
    <MessageScrollerProvider>
      <MessageScrollerRoot {...props} />
    </MessageScrollerProvider>
  )
}

type MessageScrollerViewportProps = React.ComponentProps<typeof ScrollView> & {
  preserveScrollOnPrepend?: boolean
}

function MessageScrollerViewport({
  className,
  contentContainerClassName,
  preserveScrollOnPrepend = true,
  onLayout,
  onScroll,
  onScrollBeginDrag,
  onContentSizeChange,
  children,
  ...props
}: MessageScrollerViewportProps) {
  const engine = useEngine("MessageScrollerViewport")
  const pending = useStore(engine.pendingDefault)
  engine.preserveScrollOnPrepend = preserveScrollOnPrepend
  const setRef = React.useCallback(
    (node: RNScrollView | null) => {
      engine.scrollView = node
    },
    [engine]
  )
  return (
    <ScrollView
      ref={setRef}
      data-slot="message-scroller-viewport"
      data-pending-scroll={pending || undefined}
      role="region"
      aria-label={props["aria-label"] ?? "Messages"}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      className={cn(
        "size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content data-autoscrolling:scrollbar-none data-pending-scroll:invisible",
        className
      )}
      // The content fills the viewport (web: the content's `min-h-full`).
      contentContainerClassName={cn("grow", contentContainerClassName)}
      onLayout={(e: LayoutChangeEvent) => {
        onLayout?.(e)
        const h = e.nativeEvent.layout.height
        if (h !== engine.viewportHeight) {
          const grew = h > engine.viewportHeight
          engine.viewportHeight = h
          if (engine.mode === "following-bottom" && engine.options.autoScroll && engine.defaultApplied) engine.scrollToEnd()
          else if (grew || !engine.defaultApplied) engine.scheduleContentChange()
          else engine.scheduleCommit()
        }
      }}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        engine.onScroll(e.nativeEvent.contentOffset.y)
        onScroll?.(e)
      }}
      onScrollBeginDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        engine.userScrollIntent()
        onScrollBeginDrag?.(e)
      }}
      onContentSizeChange={(w: number, h: number) => {
        engine.contentHeight = h
        engine.scheduleContentChange()
        onContentSizeChange?.(w, h)
      }}
      {...props}
    >
      {children}
    </ScrollView>
  )
}

type MessageScrollerContentProps = ViewProps & { spacerClassName?: string }

function MessageScrollerContent({ className, spacerClassName, children, onLayout, ...props }: MessageScrollerContentProps) {
  const engine = useEngine("MessageScrollerContent")
  const spacer = useStore(engine.spacer)
  const classes = cn("flex h-max min-h-full flex-col gap-8", className)
  // The engine needs the content's bottom padding and gap to size the spacer.
  const tw = useTw()
  const style = tw(classes) as Record<string, number | undefined>
  engine.contentPaddingBottom = style.paddingBottom ?? style.paddingVertical ?? style.padding ?? 0
  engine.spacerGap = style.rowGap ?? style.gap ?? 0
  return (
    <View
      data-slot="message-scroller-content"
      role="log"
      aria-live="polite"
      className={classes}
      onLayout={(e: LayoutChangeEvent) => {
        onLayout?.(e)
        const y = e.nativeEvent.layout.y
        if (y !== engine.contentOffsetY) {
          engine.contentOffsetY = y
          engine.scheduleContentChange()
        }
      }}
      {...props}
    >
      {children}
      <View
        aria-hidden
        data-message-scroller-spacer
        className={cn(spacer === 0 && "hidden", spacerClassName)}
        style={spacer > 0 ? { height: spacer, marginTop: -engine.spacerGap } : undefined}
      />
    </View>
  )
}

type MessageScrollerItemProps = ViewProps & { messageId?: string; scrollAnchor?: boolean }

function MessageScrollerItem({ className, messageId, scrollAnchor = false, onLayout, ...props }: MessageScrollerItemProps) {
  const engine = useEngine("MessageScrollerItem")
  const key = React.useId()
  React.useLayoutEffect(() => engine.registerItem(key), [engine, key])
  React.useLayoutEffect(() => engine.updateItem(key, messageId, scrollAnchor), [engine, key, messageId, scrollAnchor])
  return (
    <View
      data-slot="message-scroller-item"
      data-message-id={messageId}
      data-scroll-anchor={scrollAnchor ? "true" : "false"}
      className={cn("min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]", className)}
      onLayout={(e: LayoutChangeEvent) => {
        onLayout?.(e)
        engine.setItemLayout(key, e.nativeEvent.layout.y, e.nativeEvent.layout.height)
      }}
      {...props}
    />
  )
}

type ButtonProps = React.ComponentProps<typeof Button>

type MessageScrollerButtonProps = ButtonProps & {
  direction?: MessageScrollerButtonDirection
  behavior?: "auto" | "smooth" | "instant"
  /** The element to render instead of the default `<Button>`; it receives the button's props. */
  render?: React.ReactElement<ButtonProps>
}

function MessageScrollerButton({
  direction = "end",
  behavior = "smooth",
  className,
  children,
  render,
  variant = "secondary",
  size = "icon-sm",
  onPress,
  ...props
}: MessageScrollerButtonProps) {
  const engine = useEngine("MessageScrollerButton")
  const edges = useStore(engine.edges)
  const active = direction === "start" ? edges.start : edges.end
  const buttonProps: ButtonProps = {
    "data-slot": "message-scroller-button",
    "data-direction": direction,
    "data-variant": variant,
    "data-size": size,
    "data-active": active ? "true" : "false",
    variant,
    size,
    "aria-label": direction === "end" ? "Scroll to end" : "Scroll to start",
    "aria-hidden": !active || undefined,
    className: cn(
      "absolute inset-s-1/2 -translate-x-1/2 border-border bg-background text-foreground transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground active:bg-muted data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
      className
    ),
    onPress: (e) => {
      if (!active) return
      onPress?.(e)
      if (direction === "start") engine.scrollToStart({ behavior })
      else engine.scrollToEnd({ behavior })
    },
    ...props,
  }
  // `data-[direction=start]:[&_svg]:rotate-180` only reaches icon size and color natively,
  // so the default icon is rotated itself.
  const content = children ?? <Icon as={ArrowDownIcon} className={direction === "start" ? "rotate-180" : undefined} />
  if (render) return React.cloneElement(render, { ...buttonProps, ...render.props }, content)
  return <Button {...buttonProps}>{content}</Button>
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
  type MessageScrollerDefaultScrollPosition,
  type MessageScrollerScrollAlign,
  type MessageScrollerScrollOptions,
  type MessageScrollerScrollable,
  type MessageScrollerVisibilityState,
}
