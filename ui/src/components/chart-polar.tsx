import * as React from "react"
import { Platform, type GestureResponderEvent, type LayoutChangeEvent } from "react-native"
import Svg, { Circle, Defs, G, Line as SvgLine, Path, Text as SvgText, TextPath } from "react-native-svg"
import { useTw, View } from "@astrawind/css"
import { cn } from "../lib/utils"
import {
  Cell,
  ChartLabel,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  LabelList,
  useChart,
  useColorResolver,
  type ChartLabelProps,
  type ChartPayloadItem,
  type LabelListProps,
} from "../lib/chart"

/** SVG text doesn't inherit React Native text styles on web, where it would default to serif. */
const svgFontFamily = Platform.OS === "web" ? "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" : undefined

/**
 * Polar charts for <ChartContainer>, with recharts' API: RadarChart and
 * RadialBarChart, and their Radar, RadialBar, PolarGrid, PolarAngleAxis and
 * PolarRadiusAxis children. Re-exported by ./chart, whose header lists what's
 * supported. Angles are recharts': degrees, counter-clockwise from 3 o'clock.
 */

type ViewProps = React.ComponentProps<typeof View>
type Datum = Record<string, any>
type Margin = { top?: number; right?: number; bottom?: number; left?: number }
type TooltipDeclared = React.ComponentProps<typeof ChartTooltip>
type LegendDeclared = React.ComponentProps<typeof ChartLegend> & { className?: string }
type Domain = [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"]

const RAD = Math.PI / 180

// ---------------------------------------------------------------------------
// Declarative children (render nothing; read by the chart)
// ---------------------------------------------------------------------------

type PolarGridProps = {
  gridType?: "polygon" | "circle"
  /** Lines from the center to each angle tick. Defaults to true. */
  radialLines?: boolean
  /** Radii of the rings, in px. Defaults to the radius axis ticks. */
  polarRadius?: number[]
  /** Angles of the radial lines. Defaults to the angle axis ticks. */
  polarAngles?: number[]
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  fill?: string
  fillOpacity?: number
  /** `fill-*` fills the rings, `opacity-*` fades the grid; `first:` / `last:` target the first / last ring. */
  className?: string
}

/** recharts' <PolarGrid>. */
function PolarGrid(_props: PolarGridProps) {
  return null
}

/** What a custom `tick` function receives. */
type PolarTickProps = {
  x: number
  y: number
  textAnchor: "start" | "middle" | "end"
  index: number
  payload: { value: any; coordinate: number; index: number }
  fill?: string
}

type PolarTick = boolean | ((props: PolarTickProps) => React.ReactNode) | { fill?: string; fontSize?: number; className?: string }

type PolarAngleAxisProps = {
  dataKey?: string
  hide?: boolean
  tick?: PolarTick
  tickLine?: boolean
  tickSize?: number
  axisLine?: boolean
  axisLineType?: "polygon" | "circle"
  orientation?: "outer" | "inner"
  tickFormatter?: (value: any, index: number) => React.ReactNode
  /** Draws the axis and tick lines (recharts draws none without one). */
  stroke?: string
  /** Classes for the tick labels, e.g. "fill-muted-foreground text-[10px]". */
  className?: string
}

/** recharts' <PolarAngleAxis>. */
function PolarAngleAxis(_props: PolarAngleAxisProps) {
  return null
}

type PolarRadiusAxisProps = {
  /** Angle of the axis, in degrees. */
  angle?: number
  hide?: boolean
  tick?: PolarTick
  tickLine?: boolean
  axisLine?: boolean
  tickCount?: number
  tickFormatter?: (value: any, index: number) => React.ReactNode
  domain?: Domain
  orientation?: "left" | "right" | "middle"
  /** Axis line color, and tick label color. */
  stroke?: string
  className?: string
  /** <ChartLabel> (recharts' <Label>), e.g. text in the middle of a radial chart. */
  children?: React.ReactNode
}

/** recharts' <PolarRadiusAxis>. */
function PolarRadiusAxis(_props: PolarRadiusAxisProps) {
  return null
}

type PolarDotProps = { r?: number; fill?: string; fillOpacity?: number; stroke?: string; strokeWidth?: number }

type RadarProps = {
  dataKey: string
  name?: string
  hide?: boolean
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  dot?: boolean | PolarDotProps
  activeDot?: boolean | PolarDotProps
  children?: React.ReactNode
}

/** recharts' <Radar>. */
function Radar(_props: RadarProps) {
  return null
}

type RadialBarProps = {
  dataKey: string
  name?: string
  hide?: boolean
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  /** Draws a track behind each bar over the whole angle range (`fill-muted`). */
  background?: boolean | { fill?: string }
  cornerRadius?: number
  stackId?: string | number
  className?: string
  /** <Cell> and <LabelList> (position "insideStart" | "insideEnd" | "end" | "center" | "outside"). */
  children?: React.ReactNode
}

/** recharts' <RadialBar>. */
function RadialBar(_props: RadialBarProps) {
  return null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Children of a chart, with fragments flattened. */
function flatten(children: React.ReactNode): React.ReactElement<any>[] {
  const out: React.ReactElement<any>[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === React.Fragment) out.push(...flatten((child.props as { children?: React.ReactNode }).children))
    else out.push(child as React.ReactElement<any>)
  })
  return out
}

/** fill, font size, weight and opacity of `fill-*` / `text-*` / `font-*` / `opacity-*` classes. */
function useSvgClassStyle() {
  const tw = useTw()
  return React.useCallback(
    (className: string | undefined) => {
      if (!className) return {} as { fill?: string; fontSize?: number; fontWeight?: string; opacity?: number }
      const s = tw(className.replace(/(^|\s)fill-/g, "$1text-"))
      return {
        fill: typeof s.color === "string" ? s.color : undefined,
        fontSize: typeof s.fontSize === "number" ? s.fontSize : undefined,
        fontWeight: typeof s.fontWeight === "string" ? s.fontWeight : undefined,
        opacity: typeof s.opacity === "number" ? s.opacity : undefined,
      }
    },
    [tw]
  )
}

/** Resolves `var(--*)` colors in react-native-svg elements returned by `tick` and <ChartLabel content>. */
function useSvgNodeResolver() {
  const resolveColor = useColorResolver()
  const resolveNode = (node: React.ReactNode): React.ReactNode => {
    if (Array.isArray(node)) return node.map((n, i) => <React.Fragment key={i}>{resolveNode(n)}</React.Fragment>)
    if (!React.isValidElement(node)) return node
    const props = node.props as Record<string, any>
    const next: Record<string, any> = {}
    for (const k of ["fill", "stroke", "stopColor", "color"]) {
      if (typeof props[k] === "string" && props[k].includes("var(")) next[k] = resolveColor(props[k])
    }
    if (props.children !== undefined && typeof props.children !== "function") next.children = React.Children.map(props.children, resolveNode)
    return React.cloneElement(node, next)
  }
  return resolveNode
}

function useSize() {
  let initial = { width: 320, height: 200 }
  try {
    initial = useChart().initialDimension
  } catch {
    // Outside a ChartContainer.
  }
  const [size, setSize] = React.useState<{ width: number; height: number }>(initial)
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setSize((s) => (s.width === width && s.height === height ? s : { width, height }))
  }, [])
  return [size, onLayout] as const
}

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle * RAD), cy - r * Math.sin(angle * RAD)]
}

function percentOf(value: number | string | undefined, total: number, fallback: number) {
  if (value === undefined) return fallback
  if (typeof value === "number") return value
  return value.trim().endsWith("%") ? (parseFloat(value) / 100) * total : parseFloat(value) || fallback
}

/** recharts' nice ticks (getNiceTickValues) for a numeric polar axis. */
function niceTicks(min: number, max: number, tickCount = 5, allowDecimals = false): number[] {
  if (max === min) max = min + 1
  if (tickCount < 2) return [min, max]
  for (let correction = 0; correction < 20; correction++) {
    const rough = (max - min) / (tickCount - 1)
    const digits = Math.floor(Math.log10(rough)) + 1
    const unit = 10 ** digits
    const scale = digits !== 1 ? 0.05 : 0.1
    let step = Number((Math.ceil(rough / unit / scale + correction) * scale * unit).toPrecision(12))
    if (!allowDecimals) step = Math.max(1, Math.ceil(step))
    const middle = min <= 0 && max >= 0 ? 0 : Math.ceil((min + max) / 2 / step) * step
    const below = Math.ceil((middle - min) / step)
    let above = Math.ceil((max - middle) / step)
    if (below + above + 1 > tickCount) continue
    above += tickCount - (below + above + 1)
    const ticks: number[] = []
    for (let i = -below; i <= above; i++) ticks.push(Number((middle + i * step).toPrecision(12)))
    return ticks
  }
  return [min, max]
}

function domainTicks(values: number[], domain: Domain | undefined, tickCount = 5) {
  const dataMin = values.length ? Math.min(...values) : 0
  const dataMax = values.length ? Math.max(...values) : 0
  const [dMin, dMax] = domain ?? [0, "auto"]
  const lo = typeof dMin === "number" ? dMin : dMin === "dataMin" ? dataMin : Math.min(0, dataMin)
  const hi = typeof dMax === "number" ? dMax : dMax === "dataMax" ? dataMax : Math.max(0, dataMax)
  const ticks = niceTicks(lo, hi, tickCount)
  if (typeof dMin === "number" || dMin === "dataMin") ticks[0] = lo
  if (typeof dMax === "number" || dMax === "dataMax") ticks[ticks.length - 1] = hi
  return ticks
}

/**
 * An annular sector between recharts angles, with rounded corners (recharts'
 * `cornerRadius`). Sweeps are capped just under a full turn, as in recharts.
 */
function sectorPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, cornerRadius = 0): string {
  const sign = Math.sign(a1 - a0) || 1
  const delta = Math.min(Math.abs(a1 - a0), 359.999)
  a1 = a0 + sign * delta
  if (!delta || r1 <= 0) return ""
  const p = (r: number, a: number) => polar(cx, cy, r, a).join(",")
  const sweep = sign > 0 ? 0 : 1
  const large = (d: number) => (Math.abs(d) > 180 ? 1 : 0)
  const cr = Math.min(Math.max(0, cornerRadius), (r1 - r0) / 2)
  // Angular size of a corner at radius r: the corner circle's center is at r ∓ cr.
  const outerCorner = cr ? Math.asin(cr / (r1 - cr)) / RAD : 0
  const innerCorner = cr && r0 > 0 ? Math.asin(Math.min(1, cr / (r0 + cr))) / RAD : 0
  if (!cr || 2 * outerCorner >= delta || 2 * innerCorner >= delta) {
    const outer = `M${p(r1, a0)}A${r1},${r1} 0 ${large(delta)} ${sweep} ${p(r1, a1)}`
    return r0 > 0 ? `${outer}L${p(r0, a1)}A${r0},${r0} 0 ${large(delta)} ${1 - sweep} ${p(r0, a0)}Z` : `${outer}L${cx},${cy}Z`
  }
  const dOuter = r1 - cr
  const lineOuter = dOuter * Math.cos(outerCorner * RAD)
  let d =
    `M${p(lineOuter, a0)}` +
    `A${cr},${cr} 0 0 ${sweep} ${p(r1, a0 + sign * outerCorner)}` +
    `A${r1},${r1} 0 ${large(delta - 2 * outerCorner)} ${sweep} ${p(r1, a1 - sign * outerCorner)}` +
    `A${cr},${cr} 0 0 ${sweep} ${p(lineOuter, a1)}`
  if (r0 > 0) {
    const lineInner = (r0 + cr) * Math.cos(innerCorner * RAD)
    d +=
      `L${p(lineInner, a1)}` +
      `A${cr},${cr} 0 0 ${sweep} ${p(r0, a1 - sign * innerCorner)}` +
      `A${r0},${r0} 0 ${large(delta - 2 * innerCorner)} ${1 - sweep} ${p(r0, a0 + sign * innerCorner)}` +
      `A${cr},${cr} 0 0 ${sweep} ${p(lineInner, a0)}`
  } else {
    d += `L${cx},${cy}`
  }
  return d + "Z"
}

type TooltipState = { index: number; x: number; y: number } | null

function TooltipOverlay({
  declared,
  state,
  width,
  height,
  payload,
  label,
}: {
  declared: TooltipDeclared | undefined
  state: TooltipState
  width: number
  height: number
  payload: ChartPayloadItem[]
  label?: React.ReactNode
}) {
  const [box, setBox] = React.useState({ width: 0, height: 0 })
  if (!declared || declared.hide || !state || !payload.length) return null
  const content = declared.content ?? <ChartTooltipContent />
  // recharts offsets the tooltip 10px from the pointer and flips it at the edges.
  let left = state.x + 10
  if (left + box.width > width) left = Math.max(0, state.x - box.width - 10)
  let top = state.y + 10
  if (top + box.height > height) top = Math.max(0, height - box.height)
  return (
    <View
      className="absolute z-10"
      style={{ left, top, pointerEvents: "none" }}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout
        setBox((b) => (b.width === w && b.height === h ? b : { width: w, height: h }))
      }}
    >
      {React.cloneElement(content, { active: true, payload, label, coordinate: { x: state.x, y: state.y } })}
    </View>
  )
}

function LegendSlot({ declared, payload, position }: { declared: LegendDeclared | undefined; payload: ChartPayloadItem[]; position: "top" | "bottom" }) {
  if (!declared || (declared.verticalAlign ?? "bottom") !== position) return null
  const content = declared.content ?? <ChartLegendContent />
  return React.cloneElement(content, { payload, verticalAlign: position, className: cn(content.props.className, declared.className) })
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

type PolarChartProps = Omit<ViewProps, "children"> & {
  data?: Datum[]
  margin?: Margin
  cx?: number | string
  cy?: number | string
  innerRadius?: number | string
  outerRadius?: number | string
  startAngle?: number
  endAngle?: number
  /** Accepted for parity with recharts. */
  accessibilityLayer?: boolean
  children?: React.ReactNode
}

type RadarChartProps = PolarChartProps

type RadialBarChartProps = PolarChartProps & {
  barSize?: number
  barGap?: number
  barCategoryGap?: number | string
}

type Ring = { r0: number; r1: number }

function PolarChart({
  chart,
  data = [],
  margin,
  cx: cxProp,
  cy: cyProp,
  innerRadius: innerRadiusProp,
  outerRadius: outerRadiusProp,
  startAngle: startAngleProp,
  endAngle: endAngleProp,
  barSize,
  barGap = 4,
  barCategoryGap = "10%",
  accessibilityLayer: _accessibilityLayer,
  className,
  children,
  ...props
}: RadialBarChartProps & { chart: "radar" | "radial" }) {
  const tw = useTw()
  const resolveColor = useColorResolver()
  const classStyle = useSvgClassStyle()
  const resolveNode = useSvgNodeResolver()
  const [size, onLayout] = useSize()
  const [touch, setTouch] = React.useState<TooltipState>(null)
  const uid = React.useId().replace(/:/g, "")

  const parts = flatten(children)
  const find = <P,>(type: unknown) => parts.find((p) => p.type === type)?.props as P | undefined
  const tooltip = find<TooltipDeclared>(ChartTooltip)
  const legend = find<LegendDeclared>(ChartLegend)
  const grid = find<PolarGridProps>(PolarGrid)
  const angleAxis = find<PolarAngleAxisProps>(PolarAngleAxis)
  const radiusAxis = find<PolarRadiusAxisProps>(PolarRadiusAxis)
  const known = new Set<unknown>([ChartTooltip, ChartLegend, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadialBar])
  const extra = parts.filter((c) => !known.has(c.type)).map((c, i) => <React.Fragment key={i}>{resolveNode(c)}</React.Fragment>)

  // Theme colors for the `[&_.recharts-*]` rules of ChartContainer.
  const foreground = tw("text-foreground").color as string | undefined
  const border = tw("text-border").color as string | undefined
  const muted = tw("bg-muted").backgroundColor as string | undefined
  const fontSize = (tw("text-xs").fontSize as number | undefined) ?? 12

  const radar = chart === "radar"
  const startAngle = startAngleProp ?? (radar ? 90 : 0)
  const endAngle = endAngleProp ?? (radar ? -270 : 360)
  const m = { top: margin?.top ?? 5, right: margin?.right ?? 5, bottom: margin?.bottom ?? 5, left: margin?.left ?? 5 }
  const w = Math.max(0, size.width - m.left - m.right)
  const h = Math.max(0, size.height - m.top - m.bottom)
  const maxRadius = Math.min(w, h) / 2
  const cx = m.left + percentOf(cxProp ?? "50%", w, w / 2)
  const cy = m.top + percentOf(cyProp ?? "50%", h, h / 2)
  const innerRadius = percentOf(innerRadiusProp, maxRadius, 0)
  const outerRadius = percentOf(outerRadiusProp ?? "80%", maxRadius, maxRadius * 0.8)
  const n = data.length

  const radars = parts.filter((p) => p.type === Radar).map((p, index) => ({ props: p.props as RadarProps, index }))
  const bars = parts.filter((p) => p.type === RadialBar).map((p, index) => ({ props: p.props as RadialBarProps, index }))
  const seriesColor = (p: RadarProps | RadialBarProps) =>
    resolveColor(p.fill ?? p.stroke ?? `var(--color-${p.dataKey})`) ?? resolveColor("var(--chart-1)")

  // Radar: categories around the circle, values along the radius.
  // Radial bars: values around the circle, categories along the radius.
  const categoryAngle = (i: number) => startAngle + (i * (endAngle - startAngle)) / (radar ? Math.max(1, n) : 1)

  // Stacked values of radial bars (positives and negatives stack separately).
  const ranges = new Map<RadialBarProps, [number, number][]>()
  const stacks = new Map<string, { pos: number[]; neg: number[] }>()
  for (const { props: p } of bars.filter((b) => !b.props.hide)) {
    let stack = p.stackId !== undefined ? stacks.get(String(p.stackId)) : undefined
    if (p.stackId !== undefined && !stack) stacks.set(String(p.stackId), (stack = { pos: Array(n).fill(0), neg: Array(n).fill(0) }))
    ranges.set(
      p,
      data.map((d, i) => {
        const v = Number(d[p.dataKey]) || 0
        if (!stack) return [0, v]
        const list = v >= 0 ? stack.pos : stack.neg
        const base = list[i]
        list[i] = base + v
        return [base, base + v]
      })
    )
  }

  const values = radar
    ? radars.filter((r) => !r.props.hide).flatMap((r) => data.map((d) => Number(d[r.props.dataKey]) || 0))
    : [...ranges.values()].flatMap((r) => r.flatMap(([a, b]) => [a, b]))
  const valueTicks = domainTicks(values, radar ? radiusAxis?.domain : undefined, radar ? (radiusAxis?.tickCount ?? 5) : 5)
  const lo = valueTicks[0]
  const hi = valueTicks[valueTicks.length - 1]
  const valueRadius = (v: number) => innerRadius + ((v - lo) / (hi - lo || 1)) * (outerRadius - innerRadius)
  const valueAngle = (v: number) => startAngle + ((v - lo) / (hi - lo || 1)) * (endAngle - startAngle)

  // Radial bar bands.
  const band = n ? (outerRadius - innerRadius) / n : 0
  const slots: string[] = []
  for (const b of bars) {
    if (b.props.hide) continue
    const key = b.props.stackId !== undefined ? `stack:${b.props.stackId}` : `bar:${b.index}`
    if (!slots.includes(key)) slots.push(key)
  }
  const gapPx =
    typeof barCategoryGap === "string" && barCategoryGap.endsWith("%") ? (band * parseFloat(barCategoryGap)) / 100 : Number(barCategoryGap) || 0
  const barWidth = Math.max(1, barSize ?? (band - 2 * gapPx - (slots.length - 1) * barGap) / Math.max(1, slots.length))
  const barsTotal = slots.length * barWidth + (slots.length - 1) * barGap
  const ringOf = (b: { props: RadialBarProps; index: number }, i: number): Ring => {
    const key = b.props.stackId !== undefined ? `stack:${b.props.stackId}` : `bar:${b.index}`
    const r0 = innerRadius + band * i + (band - barsTotal) / 2 + slots.indexOf(key) * (barWidth + barGap)
    return { r0, r1: r0 + barWidth }
  }

  // Ticks of both axes: angles of the angle axis, radii of the radius axis.
  const angleTicks = radar
    ? data.map((d, i) => ({ value: angleAxis?.dataKey ? d[angleAxis.dataKey] : i, coordinate: categoryAngle(i), index: i }))
    : valueTicks.map((v, i) => ({ value: v, coordinate: valueAngle(v), index: i }))
  const radiusTicks = radar
    ? valueTicks.map((v, i) => ({ value: v, coordinate: valueRadius(v), index: i }))
    : data.map((d, i) => ({ value: i, coordinate: innerRadius + band * i, index: i }))

  const onTouch = (e: GestureResponderEvent) => {
    if (!n) return
    const { locationX: x, locationY: y } = e.nativeEvent
    const r = Math.hypot(x - cx, y - cy)
    if (radar) {
      if (r > outerRadius * 1.2) return setTouch(null)
      const a = Math.atan2(cy - y, x - cx) / RAD
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < n; i++) {
        const dist = Math.abs(((((a - categoryAngle(i)) % 360) + 540) % 360) - 180)
        if (dist < bestDist) ((bestDist = dist), (best = i))
      }
      setTouch({ index: best, x, y })
    } else {
      if (r < innerRadius || r > outerRadius || !band) return setTouch(null)
      setTouch({ index: Math.min(n - 1, Math.floor((r - innerRadius) / band)), x, y })
    }
  }
  const defaultIndex = tooltip?.defaultIndex
  const active: TooltipState =
    touch ??
    (defaultIndex !== undefined && defaultIndex < n && size.width
      ? radar
        ? (() => {
            const [x, y] = polar(cx, cy, outerRadius / 2, categoryAngle(defaultIndex))
            return { index: defaultIndex, x, y }
          })()
        : { index: defaultIndex, x: cx, y: cy - innerRadius - band * (defaultIndex + 0.5) }
      : null)
  const tooltipOn = !!tooltip && !tooltip.hide && !!active

  const gridNodes: React.ReactNode[] = []
  const backNodes: React.ReactNode[] = []
  const nodes: React.ReactNode[] = []
  const axisNodes: React.ReactNode[] = []
  const labelNodes: React.ReactNode[] = []
  const overlays: React.ReactNode[] = []
  const drawn = size.width > 0 && size.height > 0 && n > 0 && outerRadius > 0

  // Grid.
  if (drawn && grid) {
    const angles = grid.polarAngles ?? angleTicks.map((t) => t.coordinate)
    const radii = grid.polarRadius ?? radiusTicks.map((t) => t.coordinate).filter((r) => r > 0)
    const circle = grid.gridType === "circle"
    const tokens = (grid.className ?? "").split(/\s+/).filter(Boolean)
    const classesFor = (i: number) =>
      tokens
        .map((t) => (t.startsWith("first:") ? (i === 0 ? t.slice(6) : "") : t.startsWith("last:") ? (i === radii.length - 1 ? t.slice(5) : "") : t))
        .filter(Boolean)
        .join(" ")
    const stroke = grid.stroke === "none" ? "none" : grid.stroke ? resolveColor(grid.stroke) : border
    const common = { stroke, strokeWidth: grid.strokeWidth ?? 1, strokeDasharray: grid.strokeDasharray }
    const ringPath = (r: number) => angles.map((a, i) => `${i ? "L" : "M"}${polar(cx, cy, r, a).join(",")}`).join("") + "Z"
    const fill = grid.fill && grid.fill !== "none" ? resolveColor(grid.fill) : undefined
    const maxR = Math.max(0, ...radii)
    if (fill && maxR) {
      gridNodes.push(
        circle ? (
          <Circle key="bg" cx={cx} cy={cy} r={maxR} fill={fill} fillOpacity={grid.fillOpacity} {...common} />
        ) : (
          <Path key="bg" d={ringPath(maxR)} fill={fill} fillOpacity={grid.fillOpacity} {...common} />
        )
      )
    }
    radii.forEach((r, i) => {
      const s = classStyle(classesFor(i))
      const ring = { fill: s.fill ?? "none", fillOpacity: grid.fillOpacity, opacity: s.opacity, ...common }
      gridNodes.push(circle ? <Circle key={`ring-${i}`} cx={cx} cy={cy} r={r} {...ring} /> : <Path key={`ring-${i}`} d={ringPath(r)} {...ring} />)
    })
    if (grid.radialLines !== false) {
      const s = classStyle(tokens.filter((t) => !t.includes(":")).join(" "))
      angles.forEach((a, i) => {
        const [x1, y1] = polar(cx, cy, innerRadius, a)
        const [x2, y2] = polar(cx, cy, outerRadius, a)
        gridNodes.push(<SvgLine key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} opacity={s.opacity} {...common} />)
      })
    }
  }

  // Radars.
  if (drawn && radar) {
    for (const { props: p, index } of radars) {
      if (p.hide) continue
      const color = seriesColor(p)
      const fill = p.fill?.startsWith("url(") ? p.fill : (resolveColor(p.fill) ?? (p.fill ? undefined : "none"))
      const stroke = resolveColor(p.stroke)
      const points = data.map((d, i) => polar(cx, cy, valueRadius(Number(d[p.dataKey]) || 0), categoryAngle(i)))
      nodes.push(
        <Path
          key={`radar-${index}`}
          d={points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("") + "Z"}
          fill={fill}
          fillOpacity={p.fillOpacity}
          stroke={stroke ?? "none"}
          strokeWidth={p.strokeWidth ?? 1}
          strokeDasharray={p.strokeDasharray}
        />
      )
      if (p.dot) {
        const dp = typeof p.dot === "object" ? p.dot : {}
        points.forEach(([x, y], i) =>
          overlays.push(
            <Circle
              key={`dot-${index}-${i}`}
              cx={x}
              cy={y}
              r={dp.r ?? 3}
              fill={resolveColor(dp.fill) ?? fill}
              fillOpacity={dp.fillOpacity ?? p.fillOpacity}
              stroke={resolveColor(dp.stroke) ?? stroke ?? "none"}
              strokeWidth={dp.strokeWidth ?? p.strokeWidth ?? 1}
            />
          )
        )
      }
      if (tooltipOn && active && p.activeDot !== false) {
        const ap = typeof p.activeDot === "object" ? p.activeDot : {}
        const [x, y] = points[active.index]
        overlays.push(
          <Circle
            key={`active-${index}`}
            cx={x}
            cy={y}
            r={ap.r ?? 4}
            fill={resolveColor(ap.fill) ?? color}
            fillOpacity={ap.fillOpacity}
            stroke={resolveColor(ap.stroke) ?? "transparent"}
            strokeWidth={ap.strokeWidth ?? 2}
          />
        )
      }
    }
  }

  // Radial bars.
  if (drawn && !radar) {
    for (const b of bars) {
      const p = b.props
      if (p.hide) continue
      const cells = flatten(p.children).filter((c) => c.type === Cell)
      const range = ranges.get(p)!
      const sectors = data.map((d, i) => {
        const ring = ringOf(b, i)
        const fill = resolveColor(cells[i]?.props.fill ?? d.fill ?? p.fill ?? `var(--color-${p.dataKey})`) ?? resolveColor("var(--chart-1)")
        return { ...ring, a0: valueAngle(range[i][0]), a1: valueAngle(range[i][1]), fill, d, i }
      })
      for (const s of sectors) {
        if (p.background) {
          const bg = typeof p.background === "object" ? resolveColor(p.background.fill) : undefined
          backNodes.push(
            <Path key={`bg-${b.index}-${s.i}`} d={sectorPath(cx, cy, s.r0, s.r1, startAngle, endAngle, p.cornerRadius)} fill={bg ?? muted} />
          )
        }
        if (s.a0 === s.a1) continue
        nodes.push(
          <Path
            key={`bar-${b.index}-${s.i}`}
            d={sectorPath(cx, cy, s.r0, s.r1, s.a0, s.a1, p.cornerRadius)}
            fill={s.fill}
            fillOpacity={p.fillOpacity}
            stroke={resolveColor(cells[s.i]?.props.stroke ?? p.stroke) ?? "none"}
            strokeWidth={p.strokeWidth}
          />
        )
      }
      // Labels.
      const lists = flatten(p.children).filter((c) => c.type === LabelList)
      for (const [li, l] of lists.entries()) {
        const lp = l.props as LabelListProps & { position?: string }
        const style = classStyle(lp.className)
        const fs = lp.fontSize ?? style.fontSize ?? fontSize
        const fill = resolveColor(lp.fill) ?? style.fill ?? foreground
        const transform = /(^|\s)capitalize(\s|$)/.test(lp.className ?? "")
          ? (t: string) => t.replace(/\b\w/g, (c) => c.toUpperCase())
          : /(^|\s)uppercase(\s|$)/.test(lp.className ?? "")
            ? (t: string) => t.toUpperCase()
            : (t: string) => t
        const position = lp.position ?? "center"
        const offset = lp.offset ?? 5
        for (const s of sectors) {
          const value = lp.dataKey ? s.d[lp.dataKey] : range[s.i][1] - range[s.i][0]
          const text = transform(String((lp.formatter ? lp.formatter(value) : value) ?? ""))
          const key = `label-${b.index}-${li}-${s.i}`
          const mid = (s.r0 + s.r1) / 2
          if (position === "insideStart" || position === "insideEnd" || position === "end") {
            // recharts writes these along the bar's arc.
            const sign = s.a1 >= s.a0 ? 1 : -1
            const labelAngle = position === "insideStart" ? s.a0 + sign * offset : position === "insideEnd" ? s.a1 - sign * offset : s.a1 + sign * offset
            const ccw = (position === "insideEnd" ? -1 : 1) * sign > 0
            // Glyphs sit on the inner side of a counter-clockwise path: shift it to center them on the bar.
            const r = mid + (ccw ? 1 : -1) * fs * 0.355
            const [x0, y0] = polar(cx, cy, r, labelAngle)
            const [x1, y1] = polar(cx, cy, r, labelAngle + (ccw ? 1 : -1) * 359)
            const id = `${uid}-${key}`
            labelNodes.push(
              <G key={key}>
                <Defs>
                  <Path id={id} d={`M${x0},${y0}A${r},${r} 0 1 ${ccw ? 0 : 1} ${x1},${y1}`} />
                </Defs>
                <SvgText fontSize={fs} fontWeight={style.fontWeight} fill={fill}>
                  <TextPath href={`#${id}`}>{text}</TextPath>
                </SvgText>
              </G>
            )
          } else {
            const outside = position === "outside"
            const a = (s.a0 + s.a1) / 2
            const [x, y] = polar(cx, cy, outside ? s.r1 + offset : mid, a)
            labelNodes.push(
              <SvgText
                key={key}
                x={x}
                y={y + fs * 0.355}
                fontSize={fs}
                fontWeight={style.fontWeight}
                fill={fill}
                textAnchor={outside ? (x >= cx ? "start" : "end") : "middle"}
              >
                {text}
              </SvgText>
            )
          }
        }
      }
    }
  }

  // Angle axis: tick labels outside the outer radius; lines only with a `stroke`, as in recharts.
  if (drawn && angleAxis && !angleAxis.hide) {
    const stroke = resolveColor(angleAxis.stroke)
    const tickSize = angleAxis.tickLine === false ? 0 : (angleAxis.tickSize ?? 8)
    const inner = angleAxis.orientation === "inner"
    const tickStyle = classStyle(angleAxis.className ?? (typeof angleAxis.tick === "object" ? angleAxis.tick.className : undefined))
    const tickObj = typeof angleAxis.tick === "object" ? angleAxis.tick : undefined
    if (angleAxis.axisLine !== false && stroke) {
      axisNodes.push(
        angleAxis.axisLineType === "circle" ? (
          <Circle key="angle-axis" cx={cx} cy={cy} r={outerRadius} fill="none" stroke={stroke} />
        ) : (
          <Path
            key="angle-axis"
            d={angleTicks.map((t, i) => `${i ? "L" : "M"}${polar(cx, cy, outerRadius, t.coordinate).join(",")}`).join("") + "Z"}
            fill="none"
            stroke={stroke}
          />
        )
      )
    }
    angleTicks.forEach((t, i) => {
      const [x1, y1] = polar(cx, cy, outerRadius, t.coordinate)
      const [x, y] = polar(cx, cy, outerRadius + (inner ? -1 : 1) * tickSize, t.coordinate)
      if (tickSize && stroke) axisNodes.push(<SvgLine key={`at-${i}`} x1={x1} y1={y1} x2={x} y2={y} stroke={stroke} />)
      if (angleAxis.tick === false) return
      const cos = Math.cos(t.coordinate * RAD)
      const sin = Math.sin(t.coordinate * RAD)
      const textAnchor = cos > 1e-5 ? (inner ? "end" : "start") : cos < -1e-5 ? (inner ? "start" : "end") : "middle"
      const fill = resolveColor(tickObj?.fill) ?? tickStyle.fill ?? stroke ?? foreground
      if (typeof angleAxis.tick === "function") {
        axisNodes.push(
          <G key={`al-${i}`} fontSize={fontSize}>
            {resolveNode(angleAxis.tick({ x, y, textAnchor, index: i, payload: t, fill }))}
          </G>
        )
        return
      }
      const fs = tickObj?.fontSize ?? tickStyle.fontSize ?? fontSize
      // recharts' verticalAnchor: labels in the top and bottom quarters hang from / sit on the tick.
      const dy = Math.abs(cos) <= Math.SQRT1_2 ? (sin > 0 ? 0 : fs * 0.71) : fs * 0.355
      const value = angleAxis.tickFormatter ? angleAxis.tickFormatter(t.value, i) : t.value
      axisNodes.push(
        <SvgText key={`al-${i}`} x={x} y={y + dy} fontSize={fs} fontWeight={tickStyle.fontWeight} fill={fill} textAnchor={textAnchor}>
          {String(value ?? "")}
        </SvgText>
      )
    })
  }

  // Radius axis, and its <ChartLabel> children.
  if (drawn && radiusAxis && !radiusAxis.hide) {
    const angle = radiusAxis.angle ?? 0
    const stroke = radiusAxis.stroke ? resolveColor(radiusAxis.stroke) : "#ccc"
    const radii = radiusTicks.map((t) => t.coordinate)
    const r0 = Math.min(...radii)
    const r1 = Math.max(...radii)
    if (radiusAxis.axisLine !== false) {
      const [x1, y1] = polar(cx, cy, r0, angle)
      const [x2, y2] = polar(cx, cy, r1, angle)
      axisNodes.push(<SvgLine key="radius-axis" x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} />)
    }
    if (radiusAxis.tick !== false) {
      const tickObj = typeof radiusAxis.tick === "object" ? radiusAxis.tick : undefined
      const tickStyle = classStyle(radiusAxis.className ?? tickObj?.className)
      const textAnchor = radiusAxis.orientation === "left" ? "end" : radiusAxis.orientation === "middle" ? "middle" : "start"
      radiusTicks.forEach((t, i) => {
        const [x, y] = polar(cx, cy, t.coordinate, angle)
        const fill = resolveColor(tickObj?.fill) ?? tickStyle.fill ?? stroke
        if (typeof radiusAxis.tick === "function") {
          axisNodes.push(<G key={`rl-${i}`}>{resolveNode(radiusAxis.tick({ x, y, textAnchor, index: i, payload: t, fill }))}</G>)
          return
        }
        const value = radiusAxis.tickFormatter ? radiusAxis.tickFormatter(t.value, i) : t.value
        axisNodes.push(
          <SvgText
            key={`rl-${i}`}
            x={x}
            y={y}
            fontSize={tickObj?.fontSize ?? tickStyle.fontSize ?? fontSize}
            fontWeight={tickStyle.fontWeight}
            fill={fill}
            textAnchor={textAnchor}
            transform={`rotate(${90 - angle}, ${x}, ${y})`}
          >
            {String(value ?? "")}
          </SvgText>
        )
      })
    }
    const viewBox = { cx, cy, innerRadius: r0, outerRadius: r1, startAngle: angle, endAngle: angle }
    flatten(radiusAxis.children)
      .filter((c) => c.type === ChartLabel)
      .forEach((c, i) => {
        const label = c.props as ChartLabelProps
        if (label.content) {
          // The container's `text-xs` and foreground, inherited as CSS would.
          labelNodes.push(
            <G key={`axis-label-${i}`} fontSize={fontSize} fill={foreground}>
              {resolveNode(label.content({ viewBox }))}
            </G>
          )
          return
        }
        if (label.value == null) return
        const style = classStyle(label.className)
        const fs = label.fontSize ?? style.fontSize ?? fontSize
        labelNodes.push(
          <SvgText
            key={`axis-label-${i}`}
            x={cx}
            y={cy + fs * 0.355}
            fontSize={fs}
            fontWeight={style.fontWeight}
            fill={resolveColor(label.fill) ?? style.fill ?? foreground}
            textAnchor="middle"
          >
            {String(label.value)}
          </SvgText>
        )
      })
  }

  const payloadAt = (i: number): ChartPayloadItem[] =>
    radar
      ? radars
          .filter((r) => !r.props.hide)
          .map(({ props: p }) => {
            const color = seriesColor(p)
            return { dataKey: p.dataKey, name: p.name ?? p.dataKey, value: data[i]?.[p.dataKey], color, fill: color, payload: data[i] }
          })
      : bars
          .filter((b) => !b.props.hide)
          .map(({ props: p }) => {
            const cells = flatten(p.children).filter((c) => c.type === Cell)
            const color =
              resolveColor(cells[i]?.props.fill ?? data[i]?.fill ?? p.fill ?? `var(--color-${p.dataKey})`) ?? resolveColor("var(--chart-1)")
            return { dataKey: p.dataKey, name: p.name ?? p.dataKey, value: data[i]?.[p.dataKey], color, fill: color, payload: data[i] }
          })

  const legendPayload: ChartPayloadItem[] = radar
    ? radars.map(({ props: p }) => ({
        dataKey: p.dataKey,
        value: p.name ?? p.dataKey,
        color: seriesColor(p),
        type: p.hide ? "none" : undefined,
      }))
    : data.map((d, i) => ({
        dataKey: bars[0]?.props.dataKey,
        value: d.name ?? i,
        color: resolveColor(d.fill ?? bars[0]?.props.fill ?? `var(--color-${bars[0]?.props.dataKey})`),
        payload: d,
      }))

  const tooltipLabel = active ? (radar ? (angleAxis?.dataKey ? data[active.index]?.[angleAxis.dataKey] : active.index) : undefined) : undefined

  return (
    <View className={cn("flex-1 flex-col", className)} {...props}>
      <LegendSlot declared={legend} payload={legendPayload} position="top" />
      <View
        className="relative flex-1"
        onLayout={onLayout}
        onStartShouldSetResponder={() => !!tooltip}
        onMoveShouldSetResponder={() => !!tooltip}
        onResponderGrant={onTouch}
        onResponderMove={onTouch}
        onResponderTerminationRequest={() => true}
      >
        {size.width > 0 && (
          <Svg width={size.width} height={size.height} fontFamily={svgFontFamily}>
            {extra}
            <G>{gridNodes}</G>
            <G>{backNodes}</G>
            <G>{nodes}</G>
            <G>{axisNodes}</G>
            <G>{overlays}</G>
            <G>{labelNodes}</G>
          </Svg>
        )}
        <TooltipOverlay
          declared={tooltip}
          state={tooltipOn ? active : null}
          width={size.width}
          height={size.height}
          payload={active ? payloadAt(active.index) : []}
          label={tooltipLabel}
        />
      </View>
      <LegendSlot declared={legend} payload={legendPayload} position="bottom" />
    </View>
  )
}

/** recharts' <RadarChart>: `data`, `margin`, `cx`, `cy`, `innerRadius`, `outerRadius` (px or "%"), `startAngle` (90), `endAngle` (-270). */
function RadarChart(props: RadarChartProps) {
  return <PolarChart chart="radar" {...props} />
}

/** recharts' <RadialBarChart>: the RadarChart props (angles default to 0 and 360) plus `barSize`, `barGap`, `barCategoryGap`. */
function RadialBarChart(props: RadialBarChartProps) {
  return <PolarChart chart="radial" {...props} />
}

export {
  RadarChart,
  RadialBarChart,
  Radar,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  type RadarChartProps,
  type RadialBarChartProps,
  type RadarProps,
  type RadialBarProps,
  type PolarGridProps,
  type PolarAngleAxisProps,
  type PolarRadiusAxisProps,
  type PolarTickProps,
}
