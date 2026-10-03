import * as React from "react"
import { Animated, Easing, I18nManager, Platform, StyleSheet, useWindowDimensions, View as RNView } from "react-native"
import { splitClassName } from "../core/parse"
import { resolve, type Resolved } from "../core/resolve"
import type { Attrs, ElementState } from "../core/variants"
import {
  collectDescendants,
  contentWidth,
  INJECTED,
  mapChildren,
  markStyled,
  NO_PEERS,
  PeerStore,
  scanChildren,
  usesStructure,
  type Injected,
} from "./children"
import { useTransitionStyle } from "./transition"
import { displayColor, installNativeWideGamut, wideGamutStyle } from "./wide-gamut"
import {
  AstraWindContext,
  CascadeContext,
  INHERITED_TEXT_KEYS,
  type AstraWindContextValue,
  type Cascade,
  type InheritedText,
} from "./context"

/**
 * How a component participates in styling:
 * - view:  layout box. Text styles are passed down to descendant Text.
 * - text:  receives inherited text styles.
 * - input: text styles apply to the input itself; placeholder/caret colors become props.
 * - icon:  color/size become `color`/`size` props (lucide-react-native and similar).
 */
export type StyledKind = "view" | "text" | "input" | "icon"

export interface StyledOptions {
  kind?: StyledKind
  /** Whether the component supports press/hover/focus callbacks (Pressable, TextInput). */
  interactive?: boolean
  /** Extra mapping from resolved style to props, e.g. for third-party components. */
  mapStyle?: (style: Record<string, unknown>, props: Record<string, unknown>) => void
  /**
   * Additional className props mapped to style props, e.g.
   * `{ contentContainerClassName: "contentContainerStyle" }`.
   */
  classNameProps?: Record<string, string>
  /**
   * The component renders a DOM element on web (e.g. a Radix part in @rn-primitives' web
   * builds) rather than a React Native component. On web, React Native-only props become
   * their DOM equivalents: `data-*` attributes instead of `dataSet`, `userSelect` instead
   * of `selectable`, and pointer events instead of press and hover handlers.
   */
  webDom?: boolean
}

/** React Native press/hover handlers and the DOM pointer events that stand in for them. */
const DOM_EVENTS: Record<string, string> = {
  onPressIn: "onPointerDown",
  onPressOut: "onPointerUp",
  onHoverIn: "onPointerEnter",
  onHoverOut: "onPointerLeave",
}

/** React Native style keys and their CSS equivalents (logical properties for start/end). */
const DOM_STYLE_KEYS: Record<string, string[]> = {
  paddingHorizontal: ["paddingLeft", "paddingRight"],
  paddingVertical: ["paddingTop", "paddingBottom"],
  marginHorizontal: ["marginLeft", "marginRight"],
  marginVertical: ["marginTop", "marginBottom"],
  paddingStart: ["paddingInlineStart"],
  paddingEnd: ["paddingInlineEnd"],
  marginStart: ["marginInlineStart"],
  marginEnd: ["marginInlineEnd"],
  start: ["insetInlineStart"],
  end: ["insetInlineEnd"],
  borderStartWidth: ["borderInlineStartWidth"],
  borderEndWidth: ["borderInlineEndWidth"],
  borderStartColor: ["borderInlineStartColor"],
  borderEndColor: ["borderInlineEndColor"],
  borderTopStartRadius: ["borderStartStartRadius"],
  borderTopEndRadius: ["borderStartEndRadius"],
  borderBottomStartRadius: ["borderEndStartRadius"],
  borderBottomEndRadius: ["borderEndEndRadius"],
}

/** The defaults react-native-web gives a View, so a DOM element lays out like one. */
const DOM_VIEW_DEFAULTS: AnyProps = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxSizing: "border-box",
  minWidth: 0,
  minHeight: 0,
  flexShrink: 0,
}

const PX_TRANSFORMS = new Set(["translateX", "translateY", "perspective"])

/** A resolved React Native style as a DOM style object. */
function toDomStyle(style: AnyProps): AnyProps {
  const out: AnyProps = { ...DOM_VIEW_DEFAULTS }
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue
    const keys = DOM_STYLE_KEYS[key]
    if (keys) for (const k of keys) out[k] = value
    else if (key === "lineHeight" && typeof value === "number") out.lineHeight = `${value}px`
    else if (key === "transform" && Array.isArray(value)) {
      out.transform = value
        .map((t: AnyProps) => {
          const [name, v] = Object.entries(t)[0]
          return `${name}(${typeof v === "number" && PX_TRANSFORMS.has(name) ? `${v}px` : v})`
        })
        .join(" ")
    } else out[key] = value
  }
  // `outline-none`: also drop the browser's focus ring, which ignores a zero width.
  if (out.outlineWidth === 0) out.outlineStyle = "none"
  return out
}

/** Rewrites React Native-only props for a component that renders a DOM element on web. */
function toDomProps(out: AnyProps, attrs: Attrs, style: AnyProps) {
  delete out.dataSet
  for (const k in attrs) if (k.startsWith("data-")) out[k] = attrs[k]
  if (out.selectable === false) style.userSelect = "none"
  delete out.selectable
  for (const [from, to] of Object.entries(DOM_EVENTS)) {
    if (!(from in out)) continue
    out[to] = chain(out[to], out[from])
    delete out[from]
  }
}

export interface ClassNameProps {
  className?: string
}

const warned = new Set<string>()

/**
 * `focus-visible:` on web follows the browser's heuristic: focus from the keyboard shows it, focus
 * from a pointer doesn't (text inputs always do). Native has no pointer focus, so focus is visible.
 */
let keyboardModality = true
let modalityTracked = false
function trackModality() {
  if (modalityTracked || Platform.OS !== "web") return
  modalityTracked = true
  const doc = (globalThis as unknown as { document?: { addEventListener(t: string, l: (e: { metaKey?: boolean; altKey?: boolean; ctrlKey?: boolean }) => void, c?: boolean): void } }).document
  doc?.addEventListener("keydown", (e) => {
    if (!e.metaKey && !e.altKey && !e.ctrlKey) keyboardModality = true
  }, true)
  const pointer = () => {
    keyboardModality = false
  }
  doc?.addEventListener("pointerdown", pointer, true)
  doc?.addEventListener("mousedown", pointer, true)
  doc?.addEventListener("touchstart", pointer, true)
}

function isRTL(): boolean {
  return !!(I18nManager.isRTL ?? (I18nManager as { getConstants?: () => { isRTL?: boolean } }).getConstants?.().isRTL)
}

// ---------------------------------------------------------------------------
// Resolution cache
// ---------------------------------------------------------------------------

const cache = new Map<string, Resolved>()
const MAX_CACHE = 4000
let varsIds = new WeakMap<object, number>()
let nextId = 1
const idOf = (o: object | undefined) => {
  if (!o) return 0
  let id = varsIds.get(o)
  if (!id) varsIds.set(o, (id = nextId++))
  return id
}
const themeIds = new WeakMap<object, number>()
const themeIdOf = (o: object) => {
  let id = themeIds.get(o)
  if (!id) themeIds.set(o, (id = nextId++))
  return id
}

/** What a className (with its `cn-*` tokens expanded) depends on, to keep cache keys and work small. */
interface ClassFlags {
  groups: boolean
  inAncestors: boolean
  has: boolean
  peers: boolean
  containers: boolean
  lh: boolean
  motion: boolean
  empty: boolean
  structure: boolean
  declaresGroup: boolean
}
const flagCache = new Map<string, ClassFlags>()
function classFlags(className: string, styles: Record<string, string> | undefined): ClassFlags {
  const key = className
  const hit = flagCache.get(key)
  if (hit) return hit
  let text = ""
  const visit = (cls: string, depth: number) => {
    if (cls.startsWith("cn-")) {
      const expanded = styles?.[cls]
      if (expanded && depth < 4) for (const c of splitClassName(expanded)) visit(c, depth + 1)
      return
    }
    text += ` ${cls}`
  }
  for (const c of splitClassName(className)) visit(c, 0)
  const flags: ClassFlags = {
    groups: text.includes("group-"),
    inAncestors: text.includes("in-"),
    has: text.includes("has-"),
    peers: text.includes("peer-"),
    containers: /(^|\s|:)@/.test(text),
    lh: text.includes("lh"),
    motion: text.includes("motion-"),
    empty: text.includes("empty:"),
    structure: usesStructure(text),
    declaresGroup: /(^|\s)group(\/|\s|$)/.test(text),
  }
  if (flagCache.size > 4000) flagCache.clear()
  flagCache.set(key, flags)
  return flags
}

function stableAttrs(attrs: Attrs) {
  const keys = Object.keys(attrs)
  if (!keys.length) return ""
  keys.sort()
  let s = ""
  for (const k of keys) s += `${k}=${String(attrs[k])};`
  return s
}

function stateKey(s: ElementState) {
  let k = `${s.pressed ? 1 : 0}${s.hovered ? 1 : 0}${s.focused ? 1 : 0}${s.focusVisible === false ? 0 : 1}${s.disabled ? 1 : 0}${stableAttrs(s.attrs)}`
  if (s.index !== undefined) k += `#${s.index}/${s.count}`
  if (s.empty) k += "#empty"
  if (s.has?.length) k += `#has:${s.has.map(stableAttrs).join("/")}`
  return k
}

const recordKey = (r: Record<string, ElementState | number> | undefined) =>
  r ? Object.entries(r).map(([n, v]) => `${n}:${typeof v === "number" ? v : stateKey(v)}`).join(",") : ""

function resolveCached(
  className: string,
  ctx: AstraWindContextValue,
  cascade: Cascade,
  self: ElementState,
  width: number,
  height: number,
  peers?: Record<string, ElementState>
): Resolved {
  const flags = classFlags(className, ctx.compiled.styles)
  const usesGroups = flags.groups
  const usesIn = flags.inAncestors
  const key = [
    className,
    ctx.colorScheme,
    themeIdOf(ctx.compiled),
    stateKey(self),
    idOf(cascade.vars),
    cascade.text.fontSize ?? "",
    cascade.text.color ?? "",
    usesGroups ? Object.entries(cascade.groups).map(([n, g]) => `${n}:${stateKey(g)}`).join(",") : "",
    usesIn ? cascade.ancestors.map(stableAttrs).join(",") : "",
    flags.peers ? recordKey(peers) : "",
    flags.containers ? recordKey(cascade.containers) : "",
    flags.lh ? (cascade.text.lineHeight ?? "") : "",
    flags.motion ? (ctx.reduceMotion ? 1 : 0) : "",
    cascade.flexParent ? 1 : 0,
    width,
    height,
  ].join("|")
  const hit = cache.get(key)
  if (hit) return hit
  const compiled = ctx.compiled
  const result = resolve(className, {
    getVar: compiled.getVar,
    styleMap: compiled.styles,
    inheritedVars: cascade.vars,
    rem: compiled.rem,
    em: cascade.text.fontSize ?? compiled.rem,
    lineHeight: cascade.text.lineHeight,
    windowWidth: width,
    windowHeight: height,
    containerSizes: compiled.containerSizes,
    containers: cascade.containers,
    peers,
    reduceMotion: ctx.reduceMotion,
    colorScheme: ctx.colorScheme,
    platform: Platform.OS,
    // react-native-web leaves `isRTL` undefined; its constants have the real value.
    rtl: isRTL(),
    breakpoints: compiled.breakpoints,
    themeName: compiled.name,
    themeVariants: compiled.themeVariants,
    self,
    groups: cascade.groups,
    ancestors: cascade.ancestors,
    currentColor: cascade.text.color,
    parentFlex: cascade.flexParent,
    fonts: compiled.fonts,
    defaultBorderColor: compiled.defaultBorderColor,
    defaultOutlineColor: compiled.defaultOutlineColor,
    onUnsupported: ctx.warnUnsupported
      ? (cls, reason) => {
          // Classes that come from theme tokens are expected to include web-only selectors.
          if (!className.split(/\s+/).includes(cls) || warned.has(cls)) return
          warned.add(cls)
          console.warn(`[astrawind] "${cls}" ignored: ${reason}.`)
        }
      : undefined,
  })
  if (cache.size > MAX_CACHE) cache.clear()
  cache.set(key, result)
  return result
}

/** Clears cached styles (e.g. after hot-reloading a theme). */
export function clearStyleCache() {
  cache.clear()
  varsIds = new WeakMap()
}

// ---------------------------------------------------------------------------
// Animations (animate-spin, animate-pulse, animate-ping, animate-bounce)
// ---------------------------------------------------------------------------

function useAnimation(name: string | undefined) {
  const value = React.useRef(new Animated.Value(0)).current
  React.useEffect(() => {
    if (!name) return
    value.setValue(0)
    const duration = name === "spin" ? 1000 : name === "pulse" ? 2000 : 1000
    const loop = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: name === "spin" ? Easing.linear : Easing.bezier(0.4, 0, 0.6, 1),
        useNativeDriver: Platform.OS !== "web",
      })
    )
    loop.start()
    return () => loop.stop()
  }, [name, value])
  switch (name) {
    case "spin":
      return { transform: [{ rotate: value.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }
    case "pulse":
      return { opacity: value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.5, 1] }) }
    case "ping":
      return {
        opacity: value.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 0, 0] }),
        transform: [{ scale: value.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 2, 2] }) }],
      }
    case "bounce":
      return {
        transform: [{ translateY: value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-6, 0, -6] }) }],
      }
    default:
      return undefined
  }
}

// ---------------------------------------------------------------------------
// styled()
// ---------------------------------------------------------------------------

type AnyProps = Record<string, any>

function splitAttrs(props: AnyProps) {
  let attrs: Attrs | undefined
  let rest: AnyProps | undefined
  for (const k in props) {
    if (k.startsWith("data-") || k.startsWith("aria-")) {
      ;(attrs ??= {})[k] = props[k]
      if (k.startsWith("data-")) {
        rest ??= { ...props }
        delete rest[k]
      }
    }
  }
  return { attrs: attrs ?? {}, rest: rest ?? props }
}

function chain<A extends unknown[]>(a: ((...args: A) => void) | undefined, b: (...args: A) => void) {
  return a ? (...args: A) => (a(...args), b(...args)) : b
}

/**
 * On web, Animated hands the wrapped component a style array and `collapsable={false}`.
 * Core components accept both, but others merge style as an object (Radix-style `asChild`
 * slots in @rn-primitives' web builds), which turns array entries into indexed keys, or
 * write `collapsable` to the DOM (react-native-svg, so every animated icon).
 */
function flatStyle(Component: React.ComponentType<any>) {
  const Flat = React.forwardRef<unknown, AnyProps>(function FlatStyle({ style, collapsable: _collapsable, ...props }, ref) {
    return <Component ref={ref} {...props} style={StyleSheet.flatten(style)} />
  })
  Flat.displayName = `FlatStyle(${Component.displayName ?? Component.name ?? "Component"})`
  return Flat
}

/**
 * Adds `className` support to any React Native component.
 *
 *   const Card = styled(View)
 *   <Card className="rounded-xl bg-card p-6 shadow-sm" />
 */
export function styled<P extends object>(Component: React.ComponentType<P>, options: StyledOptions = {}) {
  const { kind = "view", interactive = false, mapStyle, classNameProps, webDom = false } = options
  const AnimatedComponent = Animated.createAnimatedComponent(
    Platform.OS === "web" ? flatStyle(Component as React.ComponentType<any>) : (Component as React.ComponentType<any>)
  )

  trackModality()
  installNativeWideGamut()
  const Styled = React.forwardRef<unknown, P & ClassNameProps & AnyProps>(function Styled(allProps, ref) {
    const { className: ownClass = "", style: styleProp, [INJECTED]: injected, ...props } = allProps as AnyProps
    const inj = injected as Injected | undefined
    const ctx = React.useContext(AstraWindContext)
    const cascade = React.useContext(CascadeContext)
    const { width, height } = useWindowDimensions()
    const [pressed, setPressed] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [focusVisible, setFocusVisible] = React.useState(true)
    const [layoutWidth, setLayoutWidth] = React.useState<number>()
    const ownPeers = React.useRef<PeerStore | null>(null)

    // `**:` classes from ancestors apply to every descendant.
    const className = cascade.descendantClass ? `${ownClass} ${cascade.descendantClass}` : ownClass
    const flags = classFlags(className, ctx.compiled.styles)

    const { attrs, rest } = splitAttrs(props)
    const disabled = !!props.disabled || props["aria-disabled"] === true || props.editable === false
    const self: ElementState = { attrs, pressed, hovered, focused, focusVisible: focused && focusVisible, disabled }
    if (inj?.index !== undefined) {
      self.index = inj.index
      self.count = inj.count
    }
    if (flags.empty) self.empty = React.Children.count(props.children) === 0
    // Groups expose their descendants too, for group-has-*.
    if (flags.has || flags.declaresGroup) self.has = collectDescendants(props.children)

    const peerStore = inj?.peers ?? NO_PEERS
    const peers = React.useSyncExternalStore(peerStore.subscribe, peerStore.get, peerStore.get)
    const res = resolveCached(className, ctx, cascade, self, width, height, flags.peers ? peers : undefined)

    // A peer publishes its state for its siblings.
    const selfKey = stateKey(self)
    React.useLayoutEffect(() => {
      if (res.peer !== undefined && inj?.peers) inj.peers.set(res.peer, self, selfKey)
    })

    // Split own styles into box styles and text styles.
    const own = res.style
    let text: InheritedText | undefined
    let box: Record<string, unknown> = own
    if (kind === "view" || kind === "text") {
      // Views pass text styles down; Text keeps them and also passes them to nested Text.
      if (kind === "view") box = {}
      for (const k in own) {
        if ((INHERITED_TEXT_KEYS as readonly string[]).includes(k)) ((text ??= {}) as AnyProps)[k] = own[k]
        else if (kind === "view") box[k] = own[k]
      }
    }

    // Styles from the parent (divide borders, grid track width) sit under the element's own.
    let base = inj?.base
    if (inj?.grid) {
      const { cols, colWidth, gap } = inj.grid
      const span = res.colSpan === "full" ? cols : Math.min(Math.max(res.colSpan ?? 1, 1), cols)
      base = { ...base, width: colWidth * span + gap * (span - 1) }
    }
    if (base) box = { ...base, ...box }

    const animationStyle = useAnimation(res.animation)

    // Query containers and grids measure their content box.
    const measured = res.container !== undefined || res.grid !== undefined
    const inner = measured && layoutWidth !== undefined ? contentWidth(layoutWidth, box) : undefined

    // Cascade to descendants when this element contributes anything.
    const slot = attrs["data-slot"]
    // Views tell their children whether they're a flex container; text passes it through.
    // `asChild` parts render their child in their place, so they're transparent to it.
    const flexParent = kind === "view" && !props.asChild ? !!res.flexContainer : !!cascade.flexParent
    const contributes =
      flexParent !== !!cascade.flexParent ||
      text || res.vars || res.icon || res.group !== undefined || slot !== undefined || res.descendantClass ||
      (res.container !== undefined && inner !== undefined)
    const nextCascade = React.useMemo<Cascade | undefined>(() => {
      if (!contributes) return undefined
      return {
        text: text ? { ...cascade.text, ...text } : cascade.text,
        vars: res.vars ? { ...cascade.vars, ...res.vars } : cascade.vars,
        groups:
          res.group !== undefined ? { ...cascade.groups, [res.group]: self } : cascade.groups,
        ancestors: slot !== undefined ? [attrs, ...cascade.ancestors].slice(0, 8) : cascade.ancestors,
        icon:
          text?.color || res.icon
            ? { ...cascade.icon, ...(text?.color && { color: text.color }), ...res.icon }
            : cascade.icon,
        containers:
          res.container !== undefined && inner !== undefined
            ? { ...cascade.containers, "": inner, ...(res.container && { [res.container]: inner }) }
            : cascade.containers,
        descendantClass: res.descendantClass
          ? [cascade.descendantClass, res.descendantClass].filter(Boolean).join(" ")
          : cascade.descendantClass,
        flexParent,
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contributes, cascade, res, selfKey, inner, flexParent])

    const out: AnyProps = { ...rest, ...res.props }
    if (classNameProps) {
      for (const [from, to] of Object.entries(classNameProps)) {
        delete out[from]
        const extra = props[from] as string | undefined
        if (!extra) continue
        const extraStyle = resolveCached(extra, ctx, cascade, { attrs: {} }, width, height).style
        out[to] = props[to] ? [extraStyle, props[to]] : extraStyle
      }
    }
    if (Platform.OS === "web" && Object.keys(attrs).length) {
      out.dataSet = Object.fromEntries(
        Object.entries(attrs)
          .filter(([k]) => k.startsWith("data-"))
          .map(([k, v]) => [k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v])
      )
    }
    if (measured) out.onLayout = chain(props.onLayout, (e: any) => setLayoutWidth(e.nativeEvent.layout.width))

    // Children that depend on this element: `*:` classes, divide, grid tracks, position, peers.
    if (kind !== "text" && props.children != null) {
      const scan = scanChildren(props.children)
      const index = scan.structure || usesStructure(res.childClass)
      if (scan.peer && !ownPeers.current) ownPeers.current = new PeerStore()
      const peersForChildren = scan.peer ? ownPeers.current! : undefined
      if (res.childClass || res.divide || res.grid || index || peersForChildren) {
        const colWidth =
          res.grid && inner !== undefined ? (inner - res.grid.gap * (res.grid.cols - 1)) / res.grid.cols : undefined
        out.children = mapChildren(props.children, res, { index, peers: peersForChildren, colWidth })
      }
    }

    let finalStyle: AnyProps
    let wrapIcon = false
    if (kind === "text" || kind === "input") {
      finalStyle = { ...base, ...cascade.text, ...own }
      if (kind === "input") {
        // iOS TextInput misaligns text vertically when lineHeight is set.
        if (Platform.OS === "ios") delete finalStyle.lineHeight
        out.placeholderTextColor ??= res.props.placeholderTextColor
        out.selectionColor ??= res.props.selectionColor
      }
    } else if (kind === "icon") {
      // Icons render SVG: text props like `selectable` (from `select-none`) don't apply.
      delete out.selectable
      const flat = StyleSheet.flatten(styleProp) ?? {}
      const size = (own.width as number) ?? (own.height as number) ?? flat.width ?? cascade.icon?.size ?? 16
      out.size = props.size ?? size
      const color = props.color ?? own.color ?? cascade.icon?.color ?? cascade.text.color
      // `text-current` (`[&>svg]:text-current`) is the inherited text color: `currentColor`
      // would resolve against the DOM's CSS color on web, and doesn't exist on native.
      out.color = typeof color === "string" && /^(currentcolor|inherit)$/i.test(color) ? cascade.text.color : color
      if (Platform.OS === "web") {
        // SVG paint attributes take wide-gamut CSS colors as they are.
        for (const k of ["color", "fill", "stroke"]) if (typeof out[k] === "string") out[k] = displayColor(out[k])
      }
      if (res.props.strokeWidth !== undefined || cascade.icon?.strokeWidth !== undefined) {
        out.strokeWidth = props.strokeWidth ?? res.props.strokeWidth ?? cascade.icon?.strokeWidth
      }
      const { width: _w, height: _h, color: _c, ...iconBox } = own
      // An SVG never shrinks below its size in CSS (its min-width is its width); flex items can
      // shrink to nothing in React Native, so icons don't shrink unless a class says so.
      finalStyle = { flexShrink: 0, ...iconBox }
      // Icon libraries (lucide-react-native) pass `style` on to every path, where a transform
      // turns around the viewBox origin and opacity applies twice. Box styles go on a wrapper.
      wrapIcon = Object.keys(iconBox).length > 0 || styleProp != null
    } else {
      finalStyle = box
    }
    mapStyle?.(finalStyle, out)

    const tracksState =
      interactive || res.needs.press || res.needs.hover || res.needs.focus || res.group !== undefined || res.peer !== undefined
    if (tracksState) {
      const all = interactive || res.group !== undefined || res.peer !== undefined
      if (all || res.needs.press) {
        out.onPressIn = chain(props.onPressIn, () => setPressed(true))
        out.onPressOut = chain(props.onPressOut, () => setPressed(false))
      }
      if (all || res.needs.hover) {
        out.onHoverIn = chain(props.onHoverIn, () => setHovered(true))
        out.onHoverOut = chain(props.onHoverOut, () => setHovered(false))
      }
      out.onFocus = chain(props.onFocus, () => {
        setFocusVisible(Platform.OS !== "web" || kind === "input" || keyboardModality)
        setFocused(true)
      })
      out.onBlur = chain(props.onBlur, () => setFocused(false))
    }

    if (webDom && Platform.OS === "web") {
      finalStyle = { ...finalStyle }
      toDomProps(out, attrs, finalStyle)
    }

    const dom = webDom && Platform.OS === "web"
    const transitionStyle = useTransitionStyle(finalStyle, dom ? undefined : res.transition, ctx.reduceMotion)
    // DOM elements get plain CSS: no Animated wrapper (it can't style them), so no transitions.
    const animated = !dom && (!!animationStyle || !!res.transition)
    // An animated icon (`animate-spin`, transitions) gets its transform on the wrapper too.
    if (kind === "icon" && animated) wrapIcon = true
    const Rendered: React.ComponentType<any> = animated ? AnimatedComponent : Component
    // Always pass one flat style object: wrappers that merge styles as objects (Radix-style
    // `asChild` slots in @rn-primitives and expo-router's Link on web) turn arrays into
    // indexed keys. Animated accepts animated values inside a flat object.
    let style = dom
      ? toDomStyle(StyleSheet.flatten([finalStyle, styleProp]) ?? {})
      : animated
        ? StyleSheet.flatten([transitionStyle ? { ...finalStyle, ...transitionStyle } : finalStyle, styleProp, animationStyle])
        : styleProp
          ? StyleSheet.flatten([finalStyle, styleProp])
          : finalStyle
    style = wideGamutStyle(style)
    // react-native-web applies `box-none`/`box-only` only through the prop (they aren't CSS values).
    const pe = (style as { pointerEvents?: string } | undefined)?.pointerEvents
    if (Platform.OS === "web" && (pe === "box-none" || pe === "box-only")) {
      const { pointerEvents: _pe, ...rest } = style as Record<string, unknown>
      style = rest as typeof style
      if (out.pointerEvents === undefined) out.pointerEvents = pe
    }
    const IconComponent = Component as React.ComponentType<any>
    const element = wrapIcon ? (
      React.createElement(animated ? Animated.View : RNView, { style, pointerEvents: "box-none" }, <IconComponent ref={ref} {...out} />)
    ) : (
      <Rendered ref={ref} {...out} style={style} />
    )
    return nextCascade ? <CascadeContext.Provider value={nextCascade}>{element}</CascadeContext.Provider> : element
  })
  markStyled(Styled)
  Styled.displayName = `Styled(${Component.displayName ?? Component.name ?? "Component"})`
  return Styled as unknown as React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & ClassNameProps & { [key: `data-${string}`]: unknown } & React.RefAttributes<any>
  >
}

/**
 * Resolves a className imperatively inside a component, for props that take
 * styles (e.g. `contentContainerStyle`) or colors (e.g. `tintColor`).
 */
export function useTw() {
  const ctx = React.useContext(AstraWindContext)
  const cascade = React.useContext(CascadeContext)
  const { width, height } = useWindowDimensions()
  return React.useCallback(
    (className: string, attrs: Attrs = {}) =>
      resolveCached(className, ctx, cascade, { attrs }, width, height).style,
    [ctx, cascade, width, height]
  )
}

/** Reads the inherited text color, e.g. for tinting native controls. */
export function useCurrentColor(): string | undefined {
  return React.useContext(CascadeContext).text.color
}

/**
 * Establishes inherited text styles for a subtree, like styles on `<body>` on
 * the web. Use it at the root (and it is where portalled overlays should mount):
 *
 *   <TextRoot className="font-sans text-foreground">...</TextRoot>
 */
export function TextRoot({ className, children }: { className: string; children?: React.ReactNode }) {
  const ctx = React.useContext(AstraWindContext)
  const cascade = React.useContext(CascadeContext)
  const { width, height } = useWindowDimensions()
  const res = resolveCached(className, ctx, cascade, { attrs: {} }, width, height)
  const value = React.useMemo<Cascade>(() => {
    const text: InheritedText = { ...cascade.text }
    for (const k of INHERITED_TEXT_KEYS) {
      if (res.style[k] !== undefined) (text as AnyProps)[k] = res.style[k]
    }
    return { ...cascade, text, vars: res.vars ? { ...cascade.vars, ...res.vars } : cascade.vars, icon: { ...cascade.icon, color: text.color } }
  }, [cascade, res])
  return <CascadeContext.Provider value={value}>{children}</CascadeContext.Provider>
}
