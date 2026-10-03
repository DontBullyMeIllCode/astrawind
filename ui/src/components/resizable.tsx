import * as React from "react"
import { PanResponder, type LayoutChangeEvent } from "react-native"
import { GripVerticalIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Icon } from "./icon"
import { cn } from "../lib/utils"

/**
 * Native port of shadcn's Resizable. react-resizable-panels has no React Native
 * build; panels are flex children sized in percent, and handles are dragged
 * with a PanResponder.
 *
 * Supported, as in react-resizable-panels v4: Group `orientation`,
 * `defaultLayout`, `disabled`, `onLayoutChange`, `onLayoutChanged`; Panel `id`,
 * `defaultSize`, `minSize`, `maxSize`, `collapsible`, `collapsedSize`,
 * `disabled`, `onResize`; Separator `disabled`.
 *
 * Sizes follow v4: numbers are pixels, strings are percentages (`"50"`,
 * `"50%"`), and `"200px"` is pixels. `direction` (v3's name for `orientation`)
 * is accepted too, and with it numbers are percentages, as they were in v3.
 */

type ViewProps = React.ComponentProps<typeof View>

type Size = number | string

/** Panel id → size in percent. */
type Layout = Record<string, number>

type PanelSize = { asPercentage: number; inPixels: number }

type PanelProps = {
  id?: string
  defaultSize?: Size
  minSize?: Size
  maxSize?: Size
  collapsible?: boolean
  collapsedSize?: Size
  disabled?: boolean
  onResize?: (size: PanelSize, id: string | undefined, prevSize: PanelSize | undefined) => void
}

type GroupContextValue = {
  orientation: "horizontal" | "vertical"
  sizes: number[] | null
  disabled: boolean
  startDrag: () => void
  drag: (handleIndex: number, deltaPx: number) => void
  endDrag: () => void
}

const GroupContext = React.createContext<GroupContextValue | null>(null)
const ItemContext = React.createContext<{ panel?: number; handle?: number }>({})

function useGroup() {
  const ctx = React.useContext(GroupContext)
  if (!ctx) throw new Error("Resizable components must be used within <ResizablePanelGroup />")
  return ctx
}

/** A size in percent of `total`; undefined for pixel sizes before the group is measured. */
function toPercent(size: Size | undefined, total: number, numbersArePercent: boolean): number | undefined {
  if (size === undefined) return undefined
  if (typeof size === "number") return numbersArePercent ? size : total ? (size / total) * 100 : undefined
  const m = /^\s*(-?[\d.]+)\s*(%|px)?\s*$/.exec(size)
  if (!m) return undefined
  const n = parseFloat(m[1])
  return m[2] === "px" ? (total ? (n / total) * 100 : undefined) : n
}

type Bounds = { min: number; max: number; collapsible: boolean; collapsed: number; disabled: boolean }

/** Clamps a panel size; collapsible panels snap to `collapsedSize` past half of `minSize`. */
function clampPanel(size: number, b: Bounds) {
  if (b.collapsible && size < b.min) return size < (b.min + b.collapsed) / 2 ? b.collapsed : b.min
  return Math.min(Math.max(size, b.min), b.max)
}

const round = (n: number) => Math.round(n * 1000) / 1000

function initialSizes(panels: PanelProps[], ids: string[], total: number, pct: boolean, defaultLayout?: Layout) {
  const initial = panels.map((p, i) => defaultLayout?.[ids[i]] ?? toPercent(p.defaultSize, total, pct))
  const fixed = initial.reduce<number>((sum, s) => sum + (s ?? 0), 0)
  const free = initial.filter((s) => s === undefined).length
  const share = free ? Math.max(0, 100 - fixed) / free : 0
  return initial.map((s) => s ?? share)
}

function ResizablePanelGroup({
  className,
  orientation: orientationProp,
  direction,
  defaultLayout,
  disabled = false,
  onLayoutChange,
  onLayoutChanged,
  children,
  onLayout,
  ...props
}: ViewProps & {
  orientation?: "horizontal" | "vertical"
  /** react-resizable-panels v3's name for `orientation`. */
  direction?: "horizontal" | "vertical"
  /** Initial layout (panel id → percent), e.g. restored from storage. */
  defaultLayout?: Layout
  disabled?: boolean
  onLayoutChange?: (layout: Layout) => void
  onLayoutChanged?: (layout: Layout) => void
}) {
  const orientation = orientationProp ?? direction ?? "horizontal"
  const pct = direction !== undefined && orientationProp === undefined
  const [total, setTotal] = React.useState(0)
  const [sizes, setSizes] = React.useState<number[] | null>(null)
  const sizesRef = React.useRef<number[] | null>(null)
  sizesRef.current = sizes
  const start = React.useRef<number[] | null>(null)

  // Panels in order; each panel and handle learns its index.
  const panels: PanelProps[] = []
  let handles = 0
  const items = React.Children.toArray(children).map((child) => {
    if (!React.isValidElement(child)) return child
    if (child.type === ResizablePanel) {
      const index = panels.length
      panels.push(child.props as PanelProps)
      return (
        <ItemContext.Provider key={child.key ?? `p${index}`} value={{ panel: index }}>
          {child}
        </ItemContext.Provider>
      )
    }
    if (child.type === ResizableHandle) {
      handles++
      return (
        <ItemContext.Provider key={child.key ?? `h${handles}`} value={{ handle: Math.max(0, panels.length - 1) }}>
          {child}
        </ItemContext.Provider>
      )
    }
    return child
  })
  const ids = panels.map((p, i) => p.id ?? String(i))
  const panelsRef = React.useRef(panels)
  panelsRef.current = panels
  const idsRef = React.useRef(ids)
  idsRef.current = ids
  const count = panels.length

  const layoutOf = (list: number[]) => Object.fromEntries(idsRef.current.map((id, i) => [id, round(list[i] ?? 0)]))

  const bounds = (i: number): Bounds => {
    const p = panelsRef.current[i]
    return {
      min: toPercent(p?.minSize, total, pct) ?? 0,
      max: toPercent(p?.maxSize, total, pct) ?? 100,
      collapsible: !!p?.collapsible,
      collapsed: toPercent(p?.collapsedSize, total, pct) ?? 0,
      disabled: !!p?.disabled,
    }
  }

  // Sizes once the group is measured: defaultLayout, then defaultSize, then an equal share.
  React.useEffect(() => {
    if (!total || !count || (sizes && sizes.length === count)) return
    const next = initialSizes(panelsRef.current, idsRef.current, total, pct, defaultLayout)
    setSizes(next)
    onLayoutChange?.(layoutOf(next))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, count])

  // Panels' onResize.
  const prev = React.useRef<number[] | null>(null)
  React.useEffect(() => {
    if (!sizes) return
    sizes.forEach((s, i) => {
      const before = prev.current?.[i]
      if (before === s) return
      panelsRef.current[i]?.onResize?.(
        { asPercentage: round(s), inPixels: (s / 100) * total },
        panelsRef.current[i].id,
        before === undefined ? undefined : { asPercentage: round(before), inPixels: (before / 100) * total }
      )
    })
    prev.current = sizes
  }, [sizes, total])

  // Before the first layout, percentage sizes already apply.
  const shown = sizes ?? initialSizes(panels, ids, 0, pct, defaultLayout)

  const value: GroupContextValue = {
    orientation,
    sizes: shown,
    disabled,
    startDrag: () => {
      start.current = sizesRef.current
    },
    drag: (h, deltaPx) => {
      const base = start.current
      if (!base || !total || h + 1 >= base.length) return
      const a = bounds(h)
      const b = bounds(h + 1)
      if (a.disabled || b.disabled) return
      const delta = (deltaPx / total) * 100
      const pair = base[h] + base[h + 1]
      const nextB = clampPanel(pair - clampPanel(base[h] + delta, a), b)
      const nextA = pair - nextB
      if (nextA < (a.collapsible ? Math.min(a.collapsed, a.min) : a.min) - 0.001 || nextA > a.max + 0.001) return
      const next = [...base]
      next[h] = nextA
      next[h + 1] = nextB
      setSizes(next)
      onLayoutChange?.(layoutOf(next))
    },
    endDrag: () => {
      start.current = null
      if (sizesRef.current) onLayoutChanged?.(layoutOf(sizesRef.current))
    },
  }

  return (
    <GroupContext.Provider value={value}>
      <View
        data-slot="resizable-panel-group"
        {...({ "aria-orientation": orientation } as object)}
        className={cn("flex h-full w-full aria-[orientation=vertical]:flex-col", className)}
        onLayout={(e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout
          setTotal(orientation === "vertical" ? height : width)
          onLayout?.(e)
        }}
        {...props}
      >
        {items}
      </View>
    </GroupContext.Provider>
  )
}

function ResizablePanel({
  style,
  id: _id,
  defaultSize: _defaultSize,
  minSize: _minSize,
  maxSize: _maxSize,
  collapsible: _collapsible,
  collapsedSize: _collapsedSize,
  disabled: _disabled,
  onResize: _onResize,
  ...props
}: ViewProps & PanelProps) {
  const { sizes } = useGroup()
  const { panel = 0 } = React.useContext(ItemContext)
  const size = sizes?.[panel]
  return (
    <View
      data-slot="resizable-panel"
      // react-resizable-panels sizes panels with inline flex styles.
      style={[{ flexGrow: size ?? 1, flexShrink: 1, flexBasis: 0, overflow: "hidden" }, style]}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  disabled: disabledProp,
  ...props
}: ViewProps & {
  withHandle?: boolean
  disabled?: boolean
}) {
  const group = useGroup()
  const { handle = 0 } = React.useContext(ItemContext)
  const [active, setActive] = React.useState(false)
  const groupRef = React.useRef(group)
  groupRef.current = group
  const disabled = !!disabledProp || group.disabled
  // The separator runs across the group: vertical in a horizontal group.
  const orientation = group.orientation === "horizontal" ? "vertical" : "horizontal"

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          setActive(true)
          groupRef.current.startDrag()
        },
        onPanResponderMove: (_, g) => {
          groupRef.current.drag(handle, groupRef.current.orientation === "horizontal" ? g.dx : g.dy)
        },
        onPanResponderRelease: () => {
          setActive(false)
          groupRef.current.endDrag()
        },
        onPanResponderTerminate: () => {
          setActive(false)
          groupRef.current.endDrag()
        },
      }),
    [handle, disabled]
  )

  // `after:absolute after:inset-y-0 after:w-1 …` widens the hit area on the web; `hitSlop` does it here.
  const hitSlop = orientation === "vertical" ? { left: 8, right: 8 } : { top: 8, bottom: 8 }
  const size = group.sizes?.[handle]

  return (
    <View
      data-slot="resizable-handle"
      data-separator={disabled ? "disabled" : active ? "active" : "inactive"}
      {...({ "aria-orientation": orientation } as object)}
      role="separator"
      aria-valuenow={size === undefined ? undefined : Math.round(size)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-disabled={disabled || undefined}
      hitSlop={hitSlop}
      className={cn(
        "relative flex w-px items-center justify-center bg-border focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full",
        // Above the neighboring panels so the grip isn't clipped.
        "z-10",
        className
      )}
      {...responder.panHandlers}
      {...props}
    >
      {withHandle && (
        <View
          className={cn(
            "z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border",
            // `[&[aria-orientation=horizontal]>div]:rotate-90`
            orientation === "horizontal" && "rotate-90"
          )}
        >
          <Icon as={GripVerticalIcon} className="size-2.5" />
        </View>
      )}
    </View>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup, type Layout as ResizableLayout, type PanelSize }
