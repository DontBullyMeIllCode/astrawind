import * as React from "react"
import {
  Animated,
  Easing,
  PanResponder,
  Pressable as RNPressable,
  useColorScheme,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native"
import { Portal } from "@rn-primitives/portal"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "lucide-react-native"
import { IconStyle, Pressable, styled, Text, View } from "@astrawind/css"
import { Icon } from "./icon"
import { renderTextChildren } from "../lib/children"
import { useInsets } from "../lib/insets"
import { USE_NATIVE_DRIVER } from "../lib/overlay"
import { cn } from "../lib/utils"
import { useTheme } from "../theme"

/**
 * Native port of shadcn's Sonner. `sonner` is web-only; this file implements
 * its Toaster and `toast()` for React Native, with sonner's look (its CSS,
 * translated to classes) and the variables shadcn sets on it.
 *
 * Import `toast` from here instead of from "sonner":
 *
 *   <Toaster />
 *   toast("Event has been created", { description: "Sunday at 9:00", action: { label: "Undo", onClick: () => {} } })
 *
 * Supported: toast(), toast.success/info/warning/error/loading/message/custom/
 * promise/dismiss, getToasts/getHistory; options id, description, icon, action,
 * cancel, duration, position, dismissible, closeButton, richColors, className,
 * descriptionClassName, classNames, onDismiss, onAutoClose, toasterId. Toaster:
 * position, theme, expand, duration, gap, visibleToasts, closeButton, richColors,
 * icons, offset, swipeDirections, toastOptions, className, id. Stacked toasts
 * expand on tap (hover on the web); swipe to dismiss; offsets include the safe area.
 */

type ViewProps = React.ComponentProps<typeof View>

const AnimatedView = styled(Animated.View)

/** Classes reading the Toaster's `--normal-*` variables, which resolve at runtime (the class audit sees no Toaster). */
const toasterVars = (classes: string) => classes

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type ToastTypes = "normal" | "action" | "success" | "info" | "warning" | "error" | "loading" | "default"
type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center"
type SwipeDirection = "top" | "right" | "bottom" | "left"
type Theme = "light" | "dark" | "system"

type Action = {
  label: React.ReactNode
  onClick: (event: GestureResponderEvent) => void
}

type ToastClassnames = {
  toast?: string
  title?: string
  description?: string
  loader?: string
  closeButton?: string
  cancelButton?: string
  actionButton?: string
  success?: string
  error?: string
  info?: string
  warning?: string
  loading?: string
  default?: string
  content?: string
  icon?: string
}

type ToastIcons = Partial<Record<"success" | "info" | "warning" | "error" | "loading" | "close", React.ReactNode>>

type Renderable = React.ReactNode | (() => React.ReactNode)

type ExternalToast = {
  id?: number | string
  toasterId?: string
  icon?: React.ReactNode
  richColors?: boolean
  invert?: boolean
  closeButton?: boolean
  dismissible?: boolean
  description?: Renderable
  duration?: number
  action?: Action | React.ReactNode
  cancel?: Action | React.ReactNode
  onDismiss?: (toast: ToastT) => void
  onAutoClose?: (toast: ToastT) => void
  position?: Position
  className?: string
  descriptionClassName?: string
  classNames?: ToastClassnames
  style?: ViewProps["style"]
  unstyled?: boolean
  testID?: string
}

type ToastT = Omit<ExternalToast, "id"> & {
  id: number | string
  title?: Renderable
  type?: ToastTypes
  jsx?: React.ReactNode
  /** Set while the exit animation runs. */
  delete?: boolean
  updatedAt: number
}

type PromiseResult<T> = Renderable | ExternalToast | ((value: T) => Renderable | ExternalToast | Promise<Renderable | ExternalToast>)

type PromiseData<T> = ExternalToast & {
  loading?: Renderable
  success?: PromiseResult<T>
  error?: PromiseResult<unknown>
  description?: Renderable | ((value: T) => Renderable)
  finally?: () => void | Promise<void>
}

type Listener = () => void

let toastsCounter = 1
let toasts: ToastT[] = []
let history: ToastT[] = []
const listeners = new Set<Listener>()
const emit = () => listeners.forEach((l) => l())

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => toasts

function create(data: Omit<ToastT, "id" | "updatedAt"> & { id?: number | string }) {
  const id = data.id ?? toastsCounter++
  const existing = toasts.find((t) => t.id === id)
  const dismissible = data.dismissible ?? true
  if (existing) {
    toasts = toasts.map((t) => (t.id === id ? { ...t, ...data, id, dismissible, delete: false, updatedAt: Date.now() } : t))
  } else {
    const item: ToastT = { ...data, id, dismissible, updatedAt: Date.now() }
    toasts = [item, ...toasts]
    history = [...history, item]
  }
  emit()
  return id
}

function dismiss(id?: number | string) {
  const targets = toasts.filter((t) => (id === undefined || t.id === id) && !t.delete)
  if (!targets.length) return id
  toasts = toasts.map((t) => (targets.includes(t) ? { ...t, delete: true } : t))
  for (const t of targets) t.onDismiss?.(t)
  // With no Toaster mounted there is no exit animation to wait for.
  if (!listeners.size) toasts = toasts.filter((t) => !t.delete)
  emit()
  return id
}

function autoClose(id: number | string) {
  const t = toasts.find((x) => x.id === id)
  if (!t || t.delete) return
  toasts = toasts.map((x) => (x.id === id ? { ...x, delete: true } : x))
  t.onAutoClose?.(t)
  emit()
}

function remove(id: number | string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function isExternalToast(value: unknown): value is ExternalToast {
  return typeof value === "object" && value !== null && !React.isValidElement(value) && !Array.isArray(value)
}

const typed = (type: ToastTypes | undefined) => (message: Renderable, data?: ExternalToast) =>
  create({ ...data, type: type ?? "default", title: message })

type PromiseReturn<T> = (string | number) & { unwrap: () => Promise<T> }

function promise<T>(input: Promise<T> | (() => Promise<T>), data?: PromiseData<T>): PromiseReturn<T> | undefined {
  if (!data) return undefined
  const { loading, success, error, description, finally: onFinally, ...rest } = data
  let id: number | string | undefined
  if (loading !== undefined) {
    id = create({ ...rest, type: "loading", title: loading, description: typeof description === "function" ? undefined : description })
  }
  const p = typeof input === "function" ? input() : input
  const settle = async (option: PromiseResult<never> | undefined, value: unknown, type: ToastTypes) => {
    if (option === undefined) {
      if (id !== undefined) dismiss(id)
      return
    }
    const result = typeof option === "function" ? await (option as (v: unknown) => unknown)(value) : option
    const desc = typeof description === "function" ? (description as (v: unknown) => Renderable)(value) : description
    const next = isExternalToast(result)
      ? { ...rest, description: desc, ...result, type }
      : { ...rest, description: desc, title: result as Renderable, type }
    create({ ...next, id })
  }
  const original = p.then(
    async (value) => {
      await settle(success as PromiseResult<never>, value, "success")
      return value
    },
    async (err) => {
      await settle(error as PromiseResult<never>, err, "error")
      throw err
    }
  )
  original.catch(() => {}).finally(() => onFinally?.())
  const unwrap = () => original
  return Object.assign(id ?? toastsCounter++, { unwrap }) as unknown as PromiseReturn<T>
}

type ToastFn = ((message: Renderable, data?: ExternalToast) => string | number) & {
  success: (message: Renderable, data?: ExternalToast) => string | number
  info: (message: Renderable, data?: ExternalToast) => string | number
  warning: (message: Renderable, data?: ExternalToast) => string | number
  error: (message: Renderable, data?: ExternalToast) => string | number
  loading: (message: Renderable, data?: ExternalToast) => string | number
  message: (message: Renderable, data?: ExternalToast) => string | number
  custom: (jsx: (id: number | string) => React.ReactElement, data?: ExternalToast) => string | number
  promise: typeof promise
  dismiss: (id?: number | string) => number | string | undefined
  getHistory: () => ToastT[]
  getToasts: () => ToastT[]
}

/** Shows a toast in the mounted <Toaster />. Same API as sonner's `toast`. */
const toast: ToastFn = Object.assign(typed(undefined), {
  success: typed("success"),
  info: typed("info"),
  warning: typed("warning"),
  error: typed("error"),
  loading: typed("loading"),
  message: typed("normal"),
  custom: (jsx: (id: number | string) => React.ReactElement, data?: ExternalToast) => {
    const id = data?.id ?? toastsCounter++
    return create({ ...data, id, jsx: jsx(id) })
  },
  promise,
  dismiss,
  getHistory: () => history,
  getToasts: () => toasts.filter((t) => !t.delete),
})

// ---------------------------------------------------------------------------
// Toaster
// ---------------------------------------------------------------------------

type Offset = number | string | { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string }

type ToastOptions = {
  className?: string
  closeButton?: boolean
  descriptionClassName?: string
  style?: ViewProps["style"]
  cancelButtonStyle?: ViewProps["style"]
  actionButtonStyle?: ViewProps["style"]
  duration?: number
  unstyled?: boolean
  classNames?: ToastClassnames
}

type ToasterProps = {
  /** Only toasts with a matching `toasterId` show in a Toaster with an `id`. */
  id?: string
  invert?: boolean
  theme?: Theme
  position?: Position
  expand?: boolean
  duration?: number
  gap?: number
  visibleToasts?: number
  closeButton?: boolean
  richColors?: boolean
  toastOptions?: ToastOptions
  className?: string
  style?: ViewProps["style"]
  offset?: Offset
  mobileOffset?: Offset
  swipeDirections?: SwipeDirection[]
  icons?: ToastIcons
  containerAriaLabel?: string
  /** PortalHost to render into. Defaults to ThemeProvider's. */
  hostName?: string
}

const VISIBLE_TOASTS = 3
const TOAST_LIFETIME = 4000
const GAP = 14
const SWIPE_THRESHOLD = 45
const EASING = Easing.bezier(0.21, 1.02, 0.73, 1)
const allPositions: Position[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]

/** sonner's `richColors` palette. */
const RICH: Record<"light" | "dark", Partial<Record<ToastTypes, string>>> = {
  light: {
    success: "border-[hsl(145,92%,87%)] bg-[hsl(143,85%,96%)] text-[hsl(140,100%,27%)]",
    info: "border-[hsl(221,91%,93%)] bg-[hsl(208,100%,97%)] text-[hsl(210,92%,45%)]",
    warning: "border-[hsl(49,91%,84%)] bg-[hsl(49,100%,97%)] text-[hsl(31,92%,45%)]",
    error: "border-[hsl(359,100%,94%)] bg-[hsl(359,100%,97%)] text-[hsl(360,100%,45%)]",
  },
  dark: {
    success: "border-[hsl(147,100%,12%)] bg-[hsl(150,100%,6%)] text-[hsl(150,86%,65%)]",
    info: "border-[hsl(223,43%,17%)] bg-[hsl(215,100%,6%)] text-[hsl(216,87%,65%)]",
    warning: "border-[hsl(60,100%,9%)] bg-[hsl(64,100%,6%)] text-[hsl(46,87%,65%)]",
    error: "border-[hsl(357,89%,16%)] bg-[hsl(358,76%,10%)] text-[hsl(358,100%,81%)]",
  },
}

function toPx(value: number | string | undefined, fallback: number) {
  if (value === undefined) return fallback
  if (typeof value === "number") return value
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

function defaultSwipeDirections(position: Position): SwipeDirection[] {
  const [y, x] = position.split("-")
  const out: SwipeDirection[] = [y as SwipeDirection]
  if (x === "left" || x === "right") out.push(x)
  return out
}

function render(node: Renderable) {
  return typeof node === "function" ? node() : node
}

function isAction(value: unknown): value is Action {
  return isExternalToast(value) && "label" in value && "onClick" in value
}

type StackContext = {
  position: Position
  expanded: boolean
  setExpanded: (v: boolean) => void
  /** Pointer over a toast (web): sonner expands the stack while hovered. */
  hover: (over: boolean) => void
  ids: (number | string)[]
  heights: Record<string, number>
  setHeight: (id: number | string, h: number) => void
  gap: number
  paused: boolean
  dark: boolean
  duration: number
  closeButton: boolean
  richColors: boolean
  icons?: ToastIcons
  toastOptions?: ToastOptions
  swipeDirections: SwipeDirection[]
}

function ToastItem({ item, stack }: { item: ToastT; stack: StackContext }) {
  const top = stack.position.startsWith("top")
  const lift = top ? 1 : -1
  const index = Math.max(0, stack.ids.indexOf(item.id))
  const height = stack.heights[String(item.id)]
  const front = stack.heights[String(stack.ids[0])] ?? height ?? 0
  const measured = height !== undefined
  const dismissible = item.dismissible !== false
  const behind = !stack.expanded && index > 0
  const hidden = index >= stack.ids.length || (!stack.expanded && index >= VISIBLE_TOASTS)

  const ty = React.useRef(new Animated.Value(0)).current
  const scale = React.useRef(new Animated.Value(1)).current
  const opacity = React.useRef(new Animated.Value(0)).current
  const swipe = React.useRef(new Animated.ValueXY()).current
  const entered = React.useRef(false)
  const [swiping, setSwiping] = React.useState(false)

  // Position in the stack: collapsed toasts peek out by `gap` and shrink by 5%
  // each; expanded ones sit one after another.
  let target = 0
  let targetScale = 1
  if (stack.expanded) {
    let offset = 0
    for (let i = 0; i < index; i++) offset += (stack.heights[String(stack.ids[i])] ?? 0) + stack.gap
    target = lift * offset
  } else {
    targetScale = 1 - index * 0.05
    // Scale about the far edge (sonner's transform-origin); RN scales about the center.
    target = lift * (index * stack.gap + ((1 - targetScale) * front) / 2)
  }

  React.useEffect(() => {
    if (!measured || item.delete) return
    if (!entered.current) {
      entered.current = true
      ty.setValue(-lift * height)
    }
    Animated.parallel([
      Animated.timing(ty, { toValue: target, duration: 400, easing: EASING, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(scale, { toValue: targetScale, duration: 400, easing: EASING, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacity, { toValue: hidden ? 0 : 1, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured, target, targetScale, hidden, item.delete])

  // Exit animation, then removal.
  const exitDirection = React.useRef<SwipeDirection | null>(null)
  React.useEffect(() => {
    if (!item.delete) return
    const dir = exitDirection.current
    const h = height ?? 64
    const animations = [Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: USE_NATIVE_DRIVER })]
    if (dir === "left" || dir === "right") {
      animations.push(
        Animated.timing(swipe.x, { toValue: (dir === "left" ? -1 : 1) * 400, duration: 200, easing: EASING, useNativeDriver: USE_NATIVE_DRIVER })
      )
    } else if (dir) {
      animations.push(
        Animated.timing(swipe.y, { toValue: (dir === "top" ? -1 : 1) * (h + 100), duration: 200, easing: EASING, useNativeDriver: USE_NATIVE_DRIVER })
      )
    } else {
      animations.push(Animated.timing(ty, { toValue: target - lift * h * 0.5, duration: 200, easing: EASING, useNativeDriver: USE_NATIVE_DRIVER }))
    }
    Animated.parallel(animations).start(() => remove(item.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.delete])

  // Auto-close, paused while expanded or swiping. Loading toasts stay.
  const duration = item.duration ?? stack.toastOptions?.duration ?? stack.duration
  const remaining = React.useRef(duration)
  React.useEffect(() => {
    remaining.current = duration
  }, [duration, item.updatedAt])
  React.useEffect(() => {
    if (item.delete || stack.paused || swiping || item.type === "loading" || !Number.isFinite(duration)) return
    const started = Date.now()
    const timer = setTimeout(() => autoClose(item.id), Math.max(0, remaining.current))
    return () => {
      clearTimeout(timer)
      remaining.current -= Date.now() - started
    }
  }, [stack.paused, swiping, duration, item.updatedAt, item.delete, item.type, item.id])

  const directions = React.useRef(stack.swipeDirections)
  directions.current = stack.swipeDirections
  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => dismissible && item.type !== "loading" && (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6),
        onPanResponderGrant: () => setSwiping(true),
        onPanResponderMove: (_, g) => {
          const allowed = (d: SwipeDirection) => directions.current.includes(d)
          const horizontal = Math.abs(g.dx) > Math.abs(g.dy)
          let x = 0
          let y = 0
          // Dragging against an allowed direction is dampened, like sonner.
          if (horizontal) x = (g.dx < 0 ? allowed("left") : allowed("right")) ? g.dx : g.dx * 0.1
          else y = (g.dy < 0 ? allowed("top") : allowed("bottom")) ? g.dy : g.dy * 0.1
          swipe.setValue({ x, y })
        },
        onPanResponderRelease: (_, g) => {
          setSwiping(false)
          const horizontal = Math.abs(g.dx) > Math.abs(g.dy)
          const dist = horizontal ? g.dx : g.dy
          const velocity = horizontal ? g.vx : g.vy
          const dir: SwipeDirection = horizontal ? (dist < 0 ? "left" : "right") : dist < 0 ? "top" : "bottom"
          if (directions.current.includes(dir) && (Math.abs(dist) >= SWIPE_THRESHOLD || Math.abs(velocity) > 0.11 * 5)) {
            exitDirection.current = dir
            dismiss(item.id)
          } else {
            Animated.spring(swipe, { toValue: { x: 0, y: 0 }, useNativeDriver: USE_NATIVE_DRIVER }).start()
          }
        },
        onPanResponderTerminate: () => {
          setSwiping(false)
          Animated.spring(swipe, { toValue: { x: 0, y: 0 }, useNativeDriver: USE_NATIVE_DRIVER }).start()
        },
      }),
    [dismissible, item.id, item.type, swipe]
  )

  // The whole toast's height (padding and border included), for the expanded offsets. Collapsed
  // behind the front toast it takes that toast's height, so it's measured only in front or expanded.
  const onLayout = (e: LayoutChangeEvent) => {
    if (!behind) stack.setHeight(item.id, Math.round(e.nativeEvent.layout.height))
  }

  const type = item.type ?? "default"
  const opts = stack.toastOptions
  const classNames = { ...opts?.classNames, ...item.classNames }
  const richColors = item.richColors ?? stack.richColors
  const closeButton = item.closeButton ?? opts?.closeButton ?? stack.closeButton
  const unstyled = item.unstyled ?? opts?.unstyled
  const icon =
    item.icon ??
    (type === "success" || type === "info" || type === "warning" || type === "error" || type === "loading" ? stack.icons?.[type] : undefined)
  const title = render(item.title)
  const description = render(item.description)

  const button = (value: Action | React.ReactNode, kind: "action" | "cancel") => {
    if (!isAction(value)) return value ?? null
    return (
      <Pressable
        data-button
        data-action={kind === "action" || undefined}
        data-cancel={kind === "cancel" || undefined}
        role="button"
        className={cn(
          // sonner's `[data-button]`.
          "h-6 shrink-0 flex-row items-center justify-center rounded-[4px] px-2",
          kind === "action"
            ? toasterVars("ml-auto bg-(--normal-text)")
            : stack.dark
              ? "bg-white/30"
              : "bg-black/8",
          kind === "action" ? classNames.actionButton : classNames.cancelButton
        )}
        style={kind === "action" ? opts?.actionButtonStyle : opts?.cancelButtonStyle}
        onPress={(e: GestureResponderEvent) => {
          value.onClick(e)
          if (kind === "cancel" || !e.defaultPrevented) dismiss(item.id)
        }}
      >
        {renderTextChildren(
          value.label,
          cn("text-xs font-medium", kind === "action" ? toasterVars("text-(--normal-bg)") : toasterVars("text-(--normal-text)")),
          { numberOfLines: 1 }
        )}
      </Pressable>
    )
  }

  return (
    <AnimatedView
      data-sonner-toast
      data-type={type}
      data-styled={!item.jsx && !unstyled}
      data-expanded={stack.expanded}
      data-front={index === 0}
      data-index={index}
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      testID={item.testID}
      onLayout={onLayout}
      className={cn(
        "absolute right-0 left-0",
        !item.jsx &&
          !unstyled &&
          cn(
            // sonner's `[data-sonner-toast][data-styled=true]`.
            "flex-row items-center gap-1.5 border p-4 shadow-[0_4px_12px_#0000001a]",
            toasterVars("rounded-(--border-radius) border-(--normal-border) bg-(--normal-bg) text-(--normal-text)"),
            richColors && RICH[stack.dark ? "dark" : "light"][type]
          ),
        opts?.className,
        classNames.toast,
        classNames[type as keyof ToastClassnames],
        item.className
      )}
      style={[
        top ? { top: 0 } : { bottom: 0 },
        { pointerEvents: hidden ? "none" : "auto" },
        { zIndex: 1000 - index, elevation: 10 - Math.min(index, 9) },
        // Stacked toasts take the front toast's height.
        behind && front ? { height: front, overflow: "hidden" } : null,
        { opacity, transform: [{ translateX: swipe.x }, { translateY: Animated.add(ty, swipe.y) }, { scale }] },
        opts?.style,
        item.style,
      ]}
      {...responder.panHandlers}
    >
      {closeButton && !item.jsx && dismissible && (
        <Pressable
          data-close-button
          role="button"
          aria-label="Close toast"
          hitSlop={8}
          className={cn(
            // sonner's `[data-close-button]`.
            "absolute -top-1.5 -left-1.5 z-10 size-5 items-center justify-center rounded-full border",
            toasterVars("border-(--normal-border) bg-(--normal-bg)"),
            classNames.closeButton
          )}
          onPress={() => dismiss(item.id)}
        >
          {stack.icons?.close ?? <Icon as={XIcon} className="size-3" />}
        </Pressable>
      )}
      <RNPressable
        accessible={false}
        onPress={stack.ids.length > 1 ? () => stack.setExpanded(!stack.expanded) : undefined}
        onHoverIn={() => stack.hover(true)}
        onHoverOut={() => stack.hover(false)}
        style={{ flex: 1 }}
      >
        <Animated.View style={{ flexDirection: "row", alignItems: "center", gap: 6, opacity: behind ? 0 : 1 }}
        >
          {item.jsx ?? (
            <>
              {(icon || type === "loading") && (
                <View data-icon className={cn("-ml-[3px] mr-1 size-4 shrink-0 items-center justify-center", classNames.icon)}>
                  <IconStyle size={16}>
                    {icon ?? <Icon as={Loader2Icon} className={cn("size-4 animate-spin", classNames.loader)} />}
                  </IconStyle>
                </View>
              )}
              <View data-content className={cn("min-w-0 flex-1 flex-col gap-0.5", classNames.content)}>
                {title != null && title !== false && (
                  <View data-title className="flex-row">
                    {renderTextChildren(title, cn("text-[13px] leading-normal font-medium", classNames.title))}
                  </View>
                )}
                {description != null && description !== false && (
                  <View data-description className="flex-row">
                    {renderTextChildren(
                      description,
                      cn(
                        // sonner's `[data-description]` color, unless rich colors tint it.
                        "text-[13px] leading-[1.4] font-normal",
                        !richColors && (stack.dark ? "text-[hsl(0,0%,91%)]" : "text-[#3f3f3f]"),
                        opts?.descriptionClassName,
                        item.descriptionClassName,
                        classNames.description
                      )
                    )}
                  </View>
                )}
              </View>
              {button(item.cancel, "cancel")}
              {button(item.action, "action")}
            </>
          )}
        </Animated.View>
      </RNPressable>
    </AnimatedView>
  )
}

function Stack({
  position,
  items,
  props,
  dark,
}: {
  position: Position
  items: ToastT[]
  props: ToasterProps
  dark: boolean
}) {
  const [expandedState, setExpanded] = React.useState(false)
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const insets = useInsets()
  const visible = props.visibleToasts ?? VISIBLE_TOASTS
  const open = items.filter((t) => !t.delete)
  const ids = open.map((t) => t.id)
  const shown = items.filter((t) => t.delete || open.indexOf(t) < visible || expandedState || props.expand)
  const expanded = !!props.expand || expandedState
  const gap = props.gap ?? GAP
  const top = position.startsWith("top")

  React.useEffect(() => {
    if (ids.length <= 1) setExpanded(false)
  }, [ids.length])

  const setHeight = React.useCallback((id: number | string, h: number) => {
    setHeights((prev) => (prev[String(id)] === h ? prev : { ...prev, [String(id)]: h }))
  }, [])

  // sonner's mobile layout (full width, 16px from the edges), plus the safe area.
  const offset = props.mobileOffset ?? props.offset
  const o = typeof offset === "object" ? offset : { top: offset, right: offset, bottom: offset, left: offset }
  const edge = {
    top: insets.top + toPx(o.top, 16),
    bottom: insets.bottom + toPx(o.bottom, 16),
    left: insets.left + toPx(o.left, 16),
    right: insets.right + toPx(o.right, 16),
  }

  // Leaving one toast for the next (or the gap between them) shouldn't collapse the stack.
  const collapseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
  }, [])
  const hover = React.useCallback(
    (over: boolean) => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current)
      collapseTimer.current = null
      if (over) {
        if (ids.length > 1) setExpanded(true)
      } else {
        collapseTimer.current = setTimeout(() => setExpanded(false), 100)
      }
    },
    [ids.length]
  )

  const stack: StackContext = {
    position,
    expanded,
    setExpanded,
    hover,
    ids,
    heights,
    setHeight,
    gap,
    paused: expanded && !props.expand,
    dark,
    duration: props.duration ?? TOAST_LIFETIME,
    closeButton: !!props.closeButton,
    richColors: !!props.richColors,
    icons: props.icons,
    toastOptions: props.toastOptions,
    swipeDirections: props.swipeDirections ?? defaultSwipeDirections(position),
  }

  // The list must cover its toasts: Android doesn't deliver touches outside a parent's bounds.
  const frontHeight = heights[String(ids[0])] ?? 0
  const height = expanded
    ? ids.reduce<number>((sum, id, i) => sum + (heights[String(id)] ?? 0) + (i ? gap : 0), 0)
    : frontHeight + Math.min(ids.length - 1, visible - 1) * gap

  const align = position.endsWith("left") ? "items-start" : position.endsWith("right") ? "items-end" : "items-center"

  return (
    <View
      data-sonner-toaster
      data-y-position={top ? "top" : "bottom"}
      data-x-position={position.split("-")[1]}
      style={{ position: "absolute", left: edge.left, right: edge.right, pointerEvents: "box-none", ...(top ? { top: edge.top } : { bottom: edge.bottom }) }}
      className={cn("flex-col", align)}
    >
      <View className="relative w-full max-w-[356px]" style={{ height, pointerEvents: "box-none" }}>
        {shown.map((item) => (
          <ToastItem key={item.id} item={item} stack={stack} />
        ))}
      </View>
    </View>
  )
}

let portalCount = 0

/** Renders sonner's toasts. Mount it once, inside ThemeProvider. */
function SonnerToaster(props: ToasterProps) {
  const { theme = "light", position = "bottom-right", className, style, hostName, id, containerAriaLabel = "Notifications" } = props
  const all = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const system = useColorScheme()
  const dark = (theme === "system" ? system : theme) === "dark"
  const [name] = React.useState(() => `sonner-toaster-${++portalCount}`)
  const items = all.filter((t) => (id ? t.toasterId === id : !t.toasterId))

  if (!items.length) return null

  return (
    <Portal name={name} hostName={hostName}>
      <View
        role="region"
        aria-label={containerAriaLabel}
        data-sonner-theme={dark ? "dark" : "light"}
        className={cn("absolute inset-0 z-50", className)}
        style={[{ pointerEvents: "box-none" }, style]}
      >
        {allPositions.map((pos) => {
          const list = items.filter((t) => (t.position ?? position) === pos)
          return list.length ? <Stack key={pos} position={pos} items={list} props={props} dark={dark} /> : null
        })}
      </View>
    </Portal>
  )
}

const Toaster = ({ className, ...props }: ToasterProps) => {
  // Upstream passes next-themes' `theme`; the resolved theme also covers ThemeProvider's `forcedTheme`.
  const { resolvedTheme } = useTheme()

  return (
    <SonnerToaster
      theme={resolvedTheme as ToasterProps["theme"]}
      // Upstream's `toaster group` class and `--normal-*` / `--border-radius` style variables.
      className={cn(
        "group [--border-radius:var(--radius)] [--normal-bg:var(--popover)] [--normal-border:var(--border)] [--normal-text:var(--popover-foreground)]",
        className
      )}
      icons={{
        success: <Icon as={CircleCheckIcon} className="size-4" />,
        info: <Icon as={InfoIcon} className="size-4" />,
        warning: <Icon as={TriangleAlertIcon} className="size-4" />,
        error: <Icon as={OctagonXIcon} className="size-4" />,
        loading: <Icon as={Loader2Icon} className="size-4 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster, toast, type ToasterProps, type ExternalToast, type ToastT, type Action as ToastAction, type Position as ToastPosition }
