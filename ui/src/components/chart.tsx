import * as React from "react"
import { Platform, type GestureResponderEvent, type LayoutChangeEvent } from "react-native"
import Svg, { Circle, G, Line as SvgLine, Path, Rect, Text as SvgText } from "react-native-svg"
import { useTw, View } from "@astrawind/css"
import {
  Cell,
  ChartContainer,
  ChartContext,
  ChartLabel,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  INITIAL_DIMENSION,
  LabelList,
  useChart,
  useColorResolver,
  type ChartConfig,
  type ChartLabelProps,
  type ChartLegendContentProps,
  type ChartLegendProps,
  type ChartPayloadItem,
  type ChartTooltipContentProps,
  type ChartTooltipProps,
  type Datum,
  type LabelListProps,
  type PieViewBox,
  type ViewProps,
} from "../lib/chart"
import { cn } from "../lib/utils"

/** SVG text doesn't inherit React Native text styles on web, where it would default to serif. */
const svgFontFamily = Platform.OS === "web" ? "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" : undefined

/**
 * Native port of shadcn's Chart. recharts has no React Native build, so this
 * file also provides react-native-svg chart primitives with recharts' API, for
 * use inside <ChartContainer> the way shadcn's chart examples use recharts:
 *
 *   <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
 *     <BarChart data={chartData}>
 *       <CartesianGrid vertical={false} />
 *       <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
 *       <ChartTooltip content={<ChartTooltipContent />} />
 *       <ChartLegend content={<ChartLegendContent />} />
 *       <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
 *     </BarChart>
 *   </ChartContainer>
 *
 * Supported (a subset of recharts; colors may be CSS colors or `var(--color-<key>)`):
 * - BarChart, LineChart, AreaChart: `data`, `margin`, `layout` ("horizontal" |
 *   "vertical", i.e. horizontal bars), `barGap`, `barCategoryGap`, `maxBarSize`.
 * - Bar: `dataKey`, `name`, `fill`, `radius` (number or [tl, tr, br, bl]),
 *   `stackId`, `barSize`, `maxBarSize`, `hide`, `stroke`, `strokeWidth`, `shape`
 *   (recharts 3: `(props: BarShapeProps) => <Rectangle {...props} />`, e.g. to
 *   highlight one bar); <Cell fill> and <LabelList> children. A datum's `fill`
 *   colors its bar. Negative values grow down (or left), and their "top" labels flip.
 * - Line: `dataKey`, `name`, `type` ("linear" | "monotone" | "natural" | "step" |
 *   "stepBefore" | "stepAfter"), `stroke`, `strokeWidth`, `strokeDasharray`,
 *   `dot` (boolean | { fill, r, stroke, strokeWidth }), `activeDot`, `connectNulls`, `hide`; <LabelList>.
 * - Area: the Line props plus `fill`, `fillOpacity` (0.6), `stackId`. `fill`
 *   can be `url(#id)` pointing at react-native-svg <Defs> passed as a chart child
 *   (their `var(--color-*)` stop colors are resolved).
 * - XAxis / YAxis: `dataKey`, `type`, `hide`, `tickLine`, `axisLine`,
 *   `tickMargin`, `tickFormatter`, `tickCount`, `interval`, `minTickGap`,
 *   `height` / `width`, `domain` ([min, max] numbers or "auto" / "dataMin" / "dataMax").
 * - CartesianGrid: `horizontal`, `vertical`, `strokeDasharray`.
 * - PieChart with Pie: `data`, `dataKey`, `nameKey`, `cx`, `cy`, `innerRadius`,
 *   `outerRadius` (px or "%"), `startAngle`, `endAngle`, `paddingAngle`, `fill`,
 *   `stroke`, `strokeWidth`, `label` (boolean or `(props: PieLabelRenderProps) =>`
 *   react-native-svg <Text>), `labelLine`, `shape` (recharts 3:
 *   `(props: PieSectorShapeProps) => <Sector {...props} />`, e.g. for an active
 *   sector); <Cell>, <LabelList> (in the middle of each sector) and <ChartLabel>
 *   (recharts' <Label>: `value` or `content({ viewBox })`) children.
 *   `var(--*)` colors in react-native-svg elements from `label`/`content` are resolved.
 * - ChartTooltip (recharts' <Tooltip>): `content`, `cursor`, `defaultIndex`,
 *   `hide`; shows while the chart is touched. ChartLegend (recharts' <Legend>):
 *   `content`, `verticalAlign`, `className` (added to the content's).
 * - RadarChart / RadialBarChart (./chart-polar, re-exported here): `data`, `margin`,
 *   `cx`, `cy`, `innerRadius`, `outerRadius` (px or "%"), `startAngle`, `endAngle`;
 *   RadialBarChart also `barSize`, `barGap`, `barCategoryGap`.
 * - Radar: `dataKey`, `name`, `fill`, `fillOpacity`, `stroke`, `strokeWidth`,
 *   `dot` (boolean | { r, fill, fillOpacity, stroke, strokeWidth }), `activeDot`, `hide`.
 * - RadialBar: `dataKey`, `name`, `fill` (or the datum's), `background`,
 *   `cornerRadius`, `stackId`, `hide`; <Cell> and <LabelList> (`position`
 *   "insideStart" | "insideEnd" | "end" along the arc, "center", "outside") children.
 * - PolarGrid: `gridType` ("polygon" | "circle"), `radialLines`, `polarRadius`,
 *   `polarAngles`, `stroke`, `strokeWidth`, `fill`, `className` (`fill-*`, `opacity-*`,
 *   `first:` / `last:` for the first / last ring).
 * - PolarAngleAxis: `dataKey`, `tick` (boolean, props or `(props: PolarTickProps) =>`
 *   react-native-svg <Text>), `tickLine`, `axisLine`, `tickFormatter`, `stroke`, `className`.
 * - PolarRadiusAxis: `angle`, `tick`, `tickLine`, `axisLine`, `tickCount`, `domain`,
 *   `orientation`, `stroke`, `tickFormatter`; <ChartLabel> children (`content({ viewBox })`
 *   gets the chart's center, e.g. for text inside a radial chart).
 * Not supported: ComposedChart, brushes, reference lines, polar tooltip cursors,
 * animations and mouse events.
 */

// ---------------------------------------------------------------------------
// Chart primitives (react-native-svg)
// ---------------------------------------------------------------------------

/** Color of `fill-*` / `text-*` classes on SVG text (`className="fill-foreground"`). */
function useSvgTextStyle() {
  const tw = useTw()
  return React.useCallback(
    (className: string | undefined) => {
      if (!className) return {}
      const s = tw(className.replace(/(^|\s)fill-/g, "$1text-"))
      return {
        fill: typeof s.color === "string" ? s.color : undefined,
        fontSize: typeof s.fontSize === "number" ? s.fontSize : undefined,
        fontWeight: typeof s.fontWeight === "string" ? s.fontWeight : undefined,
      }
    },
    [tw]
  )
}

function useSize() {
  const initial = React.useContext(ChartContext)?.initialDimension ?? INITIAL_DIMENSION
  const [size, setSize] = React.useState<{ width: number; height: number }>(initial)
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setSize((s) => (s.width === width && s.height === height ? s : { width, height }))
  }, [])
  return [size, onLayout] as const
}

type Margin = { top?: number; right?: number; bottom?: number; left?: number }
type BarRadius = number | [number, number, number, number]
type CurveType = "linear" | "monotone" | "monotoneX" | "natural" | "step" | "stepBefore" | "stepAfter" | "basis"
type DotProps = { fill?: string; r?: number; stroke?: string; strokeWidth?: number }
type Formatter = (value: any, index: number) => React.ReactNode
type Domain = [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"]

type AxisProps = {
  dataKey?: string
  type?: "number" | "category"
  hide?: boolean
  tickLine?: boolean
  axisLine?: boolean
  tickMargin?: number
  tickSize?: number
  tickFormatter?: Formatter
  tickCount?: number
  /** A number shows every (n + 1)th tick; the default hides ticks that would overlap. */
  interval?: number | "preserveStart" | "preserveEnd" | "preserveStartEnd"
  minTickGap?: number
  domain?: Domain
  allowDecimals?: boolean
  /** Classes for the tick labels, e.g. "fill-foreground text-[10px]". */
  className?: string
}

/** recharts' <XAxis>. */
function XAxis(_props: AxisProps & { height?: number }) {
  return null
}

/** recharts' <YAxis>. */
function YAxis(_props: AxisProps & { width?: number }) {
  return null
}

/** recharts' <CartesianGrid>. */
function CartesianGrid(_props: { horizontal?: boolean; vertical?: boolean; strokeDasharray?: string; stroke?: string }) {
  return null
}


type RectangleProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  radius?: BarRadius
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string | number
  strokeDashoffset?: string | number
}

/** What a Bar's `shape` receives: the bar's geometry and style, plus its datum. */
type BarShapeProps = Required<Pick<RectangleProps, "x" | "y" | "width" | "height">> &
  RectangleProps & { index: number; payload: Datum; value: any; dataKey: string }

/** recharts' <Rectangle>: a bar with rounded corners, for a Bar's `shape`. */
function Rectangle({ x = 0, y = 0, width = 0, height = 0, radius = 0, fill, stroke, ...props }: RectangleProps & Partial<BarShapeProps>) {
  const resolveColor = useColorResolver()
  if (!width || !height) return null
  return (
    <Path
      d={roundedRect(Math.min(x, x + width), Math.min(y, y + height), Math.abs(width), Math.abs(height), radius)}
      fill={resolveColor(fill)}
      fillOpacity={props.fillOpacity}
      stroke={resolveColor(stroke)}
      strokeWidth={stroke ? props.strokeWidth : undefined}
      strokeDasharray={props.strokeDasharray}
      strokeDashoffset={props.strokeDashoffset}
    />
  )
}

type SectorProps = {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
}

/** What a Pie's `shape` receives: the sector's geometry and style, plus its datum. */
type PieSectorShapeProps = SectorProps & {
  index: number
  isActive: boolean
  payload: Datum
  value: any
  name: any
  percent: number
  midAngle: number
}

/** recharts' <Sector>: a pie or donut sector, for a Pie's `shape`. */
function Sector({
  cx = 0,
  cy = 0,
  innerRadius = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
}: SectorProps & Partial<PieSectorShapeProps>) {
  const resolveColor = useColorResolver()
  if (startAngle === endAngle) return null
  return (
    <Path
      d={sectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
      fill={resolveColor(fill)}
      fillOpacity={fillOpacity}
      stroke={resolveColor(stroke) ?? "transparent"}
      strokeWidth={strokeWidth ?? 1}
    />
  )
}

/** What a Pie's `label` function receives (recharts' PieLabelRenderProps). */
type PieLabelRenderProps = Omit<PieSectorShapeProps, "isActive"> & {
  x: number
  y: number
  textAnchor: "start" | "middle" | "end"
  dominantBaseline: "central"
}

type SeriesBase = {
  dataKey: string
  name?: string
  hide?: boolean
  children?: React.ReactNode
}

type BarProps = SeriesBase & {
  fill?: string
  radius?: BarRadius
  stackId?: string | number
  barSize?: number
  maxBarSize?: number
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  /** Renders each bar, e.g. `(props) => <Rectangle {...props} />` (recharts 3). */
  shape?: (props: BarShapeProps) => React.ReactNode
}

type LineProps = SeriesBase & {
  type?: CurveType
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  dot?: boolean | DotProps
  activeDot?: boolean | DotProps
  connectNulls?: boolean
}

type AreaProps = LineProps & {
  fill?: string
  fillOpacity?: number
  stackId?: string | number
}

/** recharts' <Bar>. */
function Bar(_props: BarProps) {
  return null
}

/** recharts' <Line>. */
function Line(_props: LineProps) {
  return null
}

/** recharts' <Area>. */
function Area(_props: AreaProps) {
  return null
}

type PieProps = {
  data?: Datum[]
  dataKey: string
  nameKey?: string
  cx?: number | string
  cy?: number | string
  innerRadius?: number | string
  outerRadius?: number | string
  startAngle?: number
  endAngle?: number
  paddingAngle?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  /** `true` for value labels outside the sectors, or a function rendering react-native-svg text. */
  label?: boolean | ((props: PieLabelRenderProps) => React.ReactNode)
  labelLine?: boolean
  /** Renders each sector, e.g. `(props) => <Sector {...props} />` (recharts 3). */
  shape?: (props: PieSectorShapeProps) => React.ReactNode
  children?: React.ReactNode
}

/** recharts' <Pie>. */
function Pie(_props: PieProps) {
  return null
}

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

const KNOWN = new Set<unknown>([XAxis, YAxis, CartesianGrid, ChartTooltip, ChartLegend, Bar, Line, Area, Pie, Cell, LabelList, ChartLabel])

/** Other children (react-native-svg <Defs>, …) render inside the chart's Svg with their colors resolved. */
function useSvgChildren(children: React.ReactElement<any>[]) {
  const resolveNode = useSvgNodeResolver()
  return children.filter((c) => !KNOWN.has(c.type)).map((c, i) => <React.Fragment key={i}>{resolveNode(c)}</React.Fragment>)
}

/** Resolves `var(--*)` colors in react-native-svg elements (chart children, label content). */
function useSvgNodeResolver() {
  const resolveColor = useColorResolver()
  const resolveNode = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node
    const props = node.props as Record<string, any>
    const next: Record<string, any> = {}
    for (const k of ["fill", "stroke", "stopColor", "color"]) {
      if (typeof props[k] === "string" && props[k].includes("var(")) next[k] = resolveColor(props[k])
    }
    if (props.children !== undefined) next.children = React.Children.map(props.children, resolveNode)
    return React.cloneElement(node, next)
  }
  return resolveNode
}

function niceTicks(min: number, max: number, count: number, allowDecimals = true) {
  if (max === min) max = min + 1
  const raw = (max - min) / Math.max(1, count - 1)
  const mag = 10 ** Math.floor(Math.log10(raw))
  let step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  if (!allowDecimals) step = Math.max(1, Math.ceil(step))
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toPrecision(12)))
  return ticks
}

function domainTicks(values: number[], axis: AxisProps | undefined) {
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const [dMin, dMax] = axis?.domain ?? ["auto", "auto"]
  const lo = typeof dMin === "number" ? dMin : dMin === "dataMin" ? dataMin : Math.min(0, dataMin)
  const hi = typeof dMax === "number" ? dMax : dMax === "dataMax" ? dataMax : Math.max(0, dataMax)
  const ticks = niceTicks(lo, hi, axis?.tickCount ?? 5, axis?.allowDecimals)
  if (typeof dMin === "number" || dMin === "dataMin") ticks[0] = lo
  if (typeof dMax === "number" || dMax === "dataMax") ticks[ticks.length - 1] = hi
  return ticks.filter((t, i) => i === 0 || t > ticks[0])
}

function curvePath(points: [number, number][], curve: CurveType = "linear", move = true): string {
  if (!points.length) return ""
  const [x0, y0] = points[0]
  let d = `${move ? "M" : "L"}${x0},${y0}`
  if (curve === "step" || curve === "stepBefore" || curve === "stepAfter") {
    for (let i = 1; i < points.length; i++) {
      const [px, py] = points[i - 1]
      const [x, y] = points[i]
      if (curve === "stepBefore") d += `V${y}H${x}`
      else if (curve === "stepAfter") d += `H${x}V${y}`
      else d += `H${(px + x) / 2}V${y}H${x}`
      void py
    }
    return d
  }
  if (curve === "linear" || points.length < 3) {
    for (let i = 1; i < points.length; i++) d += `L${points[i][0]},${points[i][1]}`
    return d
  }
  if (curve === "natural") {
    // d3's curveNatural.
    const [ax, bx] = naturalControlPoints(points.map((p) => p[0]))
    const [ay, by] = naturalControlPoints(points.map((p) => p[1]))
    for (let i = 0; i < points.length - 1; i++) d += `C${ax[i]},${ay[i]} ${bx[i]},${by[i]} ${points[i + 1][0]},${points[i + 1][1]}`
    return d
  }
  // d3's curveMonotoneX (also used for "basis").
  const n = points.length
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0]
    m[i] = dx[i] ? (points[i + 1][1] - points[i][1]) / dx[i] : 0
  }
  const t: number[] = [m[0]]
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i])
  }
  t[n - 1] = m[n - 2]
  for (let i = 0; i < n - 1; i++) {
    const [xa, ya] = points[i]
    const [xb, yb] = points[i + 1]
    const h = dx[i] / 3
    d += `C${xa + h},${ya + t[i] * h} ${xb - h},${yb - t[i + 1] * h} ${xb},${yb}`
  }
  return d
}

function naturalControlPoints(x: number[]): [number[], number[]] {
  const n = x.length - 1
  const a: number[] = new Array(n)
  const b: number[] = new Array(n)
  const r: number[] = new Array(n)
  a[0] = 0
  b[0] = 2
  r[0] = x[0] + 2 * x[1]
  for (let i = 1; i < n - 1; i++) {
    a[i] = 1
    b[i] = 4
    r[i] = 4 * x[i] + 2 * x[i + 1]
  }
  a[n - 1] = 2
  b[n - 1] = 7
  r[n - 1] = 8 * x[n - 1] + x[n]
  for (let i = 1; i < n; i++) {
    const k = a[i] / b[i - 1]
    b[i] -= k
    r[i] -= k * r[i - 1]
  }
  a[n - 1] = r[n - 1] / b[n - 1]
  for (let i = n - 2; i >= 0; i--) a[i] = (r[i] - a[i + 1]) / b[i]
  b[n - 1] = (x[n] + a[n - 1]) / 2
  for (let i = 0; i < n - 1; i++) b[i] = 2 * x[i + 1] - a[i + 1]
  return [a, b]
}

/** A rectangle with per-corner radii [tl, tr, br, bl], each clamped to half the size. */
function roundedRect(x: number, y: number, w: number, h: number, radius: BarRadius) {
  const max = Math.max(0, Math.min(w / 2, h / 2))
  const [tl, tr, br, bl] = (typeof radius === "number" ? [radius, radius, radius, radius] : radius).map((r) => Math.min(Math.max(0, r), max))
  return (
    `M${x + tl},${y}H${x + w - tr}` +
    (tr ? `A${tr},${tr} 0 0 1 ${x + w},${y + tr}` : "") +
    `V${y + h - br}` +
    (br ? `A${br},${br} 0 0 1 ${x + w - br},${y + h}` : "") +
    `H${x + bl}` +
    (bl ? `A${bl},${bl} 0 0 1 ${x},${y + h - bl}` : "") +
    `V${y + tl}` +
    (tl ? `A${tl},${tl} 0 0 1 ${x + tl},${y}` : "") +
    "Z"
  )
}

/** Keeps every tick whose label doesn't overlap the previous one (recharts' `minTickGap`). */
function visibleTicks(positions: number[], sizes: number[], interval: AxisProps["interval"], gap: number) {
  if (typeof interval === "number") return positions.map((_, i) => i % (interval + 1) === 0)
  const shown = positions.map(() => false)
  const order = positions.map((_, i) => i)
  // "preserveEnd" (recharts' default) keeps the last tick; walk backwards.
  if (interval !== "preserveStart") order.reverse()
  let edge: number | undefined
  for (const i of order) {
    const half = sizes[i] / 2
    const lo = positions[i] - half
    const hi = positions[i] + half
    const forward = interval === "preserveStart"
    if (edge === undefined || (forward ? lo >= edge + gap : hi <= edge - gap)) {
      shown[i] = true
      edge = forward ? hi : lo
    }
  }
  if (interval === "preserveStartEnd") shown[0] = true
  return shown
}

type TooltipState = { index: number; x: number; y: number } | null

function useDeclared(parts: React.ReactElement<any>[]) {
  const find = <P,>(type: unknown) => parts.find((p) => p.type === type)?.props as P | undefined
  return {
    tooltip: find<ChartTooltipProps>(ChartTooltip),
    legend: find<ChartLegendProps>(ChartLegend),
  }
}

function TooltipOverlay({
  declared,
  state,
  width,
  height,
  payload,
  label,
}: {
  declared: ChartTooltipProps | undefined
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

function LegendSlot({ declared, payload, position }: { declared: ChartLegendProps | undefined; payload: ChartPayloadItem[]; position: "top" | "bottom" }) {
  if (!declared || (declared.verticalAlign ?? "bottom") !== position) return null
  const content = declared.content ?? <ChartLegendContent />
  return React.cloneElement(content, {
    payload,
    verticalAlign: position,
    className: cn((content.props as { className?: string }).className, declared.className),
  })
}

type CartesianChartProps = Omit<ViewProps, "children"> & {
  data?: Datum[]
  margin?: Margin
  /** "vertical" lays categories out on the Y axis (horizontal bars). */
  layout?: "horizontal" | "vertical"
  barGap?: number
  barCategoryGap?: number | string
  maxBarSize?: number
  /** Accepted for parity with recharts; charts always expose their data to screen readers as a summary. */
  accessibilityLayer?: boolean
  children?: React.ReactNode
}

type Series =
  | { kind: "bar"; props: BarProps; index: number }
  | { kind: "line"; props: LineProps; index: number }
  | { kind: "area"; props: AreaProps; index: number }

function CartesianChart({
  chart,
  data = [],
  margin,
  layout = "horizontal",
  barGap = 4,
  barCategoryGap = "10%",
  maxBarSize,
  accessibilityLayer: _accessibilityLayer,
  className,
  children,
  ...props
}: CartesianChartProps & { chart: "bar" | "line" | "area" }) {
  const tw = useTw()
  const resolveColor = useColorResolver()
  const textStyle = useSvgTextStyle()
  const [size, onLayout] = useSize()
  const parts = flatten(children)
  const { tooltip, legend } = useDeclared(parts)
  const extra = useSvgChildren(parts)
  const [touch, setTouch] = React.useState<TooltipState>(null)

  const vertical = layout === "vertical"
  const xAxis = parts.find((p) => p.type === XAxis)?.props as (AxisProps & { height?: number }) | undefined
  const yAxis = parts.find((p) => p.type === YAxis)?.props as (AxisProps & { width?: number }) | undefined
  const grid = parts.find((p) => p.type === CartesianGrid)?.props as React.ComponentProps<typeof CartesianGrid> | undefined
  const series: Series[] = []
  parts.forEach((p, index) => {
    if (p.type === Bar) series.push({ kind: "bar", props: p.props, index })
    else if (p.type === Line) series.push({ kind: "line", props: p.props, index })
    else if (p.type === Area) series.push({ kind: "area", props: p.props, index })
  })
  const shownSeries = series.filter((s) => !s.props.hide)
  const catAxis = vertical ? yAxis : xAxis
  const valAxis = vertical ? xAxis : yAxis
  const catKey = catAxis?.dataKey

  // Theme colors for the `[&_.recharts-*]` rules of ChartContainer.
  const muted = tw("text-muted-foreground").color as string | undefined
  const gridColor = tw("text-border/50").color as string | undefined
  const cursorFill = tw("bg-muted").backgroundColor as string | undefined
  const cursorStroke = tw("text-border").color as string | undefined
  const background = tw("bg-background").backgroundColor as string | undefined
  const fontSize = (tw("text-xs").fontSize as number | undefined) ?? 12
  const axisColor = "#666"

  const m = { top: margin?.top ?? 5, right: margin?.right ?? 5, bottom: margin?.bottom ?? 5, left: margin?.left ?? 5 }
  const xShown = !!xAxis && !xAxis.hide
  const yShown = !!yAxis && !yAxis.hide
  const plot = {
    left: m.left + (yShown ? (yAxis?.width ?? 60) : 0),
    top: m.top,
    right: size.width - m.right,
    bottom: size.height - m.bottom - (xShown ? (xAxis?.height ?? 30) : 0),
  }
  const plotW = Math.max(0, plot.right - plot.left)
  const plotH = Math.max(0, plot.bottom - plot.top)

  // Values, stacked by stackId (positives and negatives stack separately, as in recharts).
  const n = data.length
  const acc = new Map<string, { pos: number[]; neg: number[] }>()
  const ranges = new Map<Series, [number, number][]>()
  for (const s of shownSeries) {
    const stackId = "stackId" in s.props ? s.props.stackId : undefined
    let stack = stackId !== undefined ? acc.get(String(stackId)) : undefined
    if (stackId !== undefined && !stack) acc.set(String(stackId), (stack = { pos: Array(n).fill(0), neg: Array(n).fill(0) }))
    ranges.set(
      s,
      data.map((d, i) => {
        const v = Number(d[s.props.dataKey]) || 0
        if (!stack) return [0, v]
        const list = v >= 0 ? stack.pos : stack.neg
        const base = list[i]
        list[i] = base + v
        return [base, base + v]
      })
    )
  }
  const values = [...ranges.values()].flatMap((r) => r.flatMap(([a, b]) => [a, b]))
  const ticks = domainTicks(values.length ? values : [0], valAxis)
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const valLen = vertical ? plotW : plotH
  const valPos = (v: number) =>
    vertical ? plot.left + ((v - lo) / (hi - lo || 1)) * valLen : plot.bottom - ((v - lo) / (hi - lo || 1)) * valLen

  // Bars use a band scale; lines and areas a point scale over the whole axis (recharts' "auto" scale).
  const catStart = vertical ? plot.top : plot.left
  const catLen = vertical ? plotH : plotW
  const band = n ? catLen / n : 0
  const pointScale = chart !== "bar"
  const catPos = (i: number) => (pointScale ? catStart + (n > 1 ? (catLen * i) / (n - 1) : catLen / 2) : catStart + band * (i + 0.5))
  const at = (c: number, v: number): [number, number] => (vertical ? [valPos(v), c] : [c, valPos(v)])

  const seriesColor = (s: Series) => {
    const p = s.props as AreaProps & BarProps
    const raw = s.kind === "line" ? (p.stroke ?? p.fill) : (p.fill ?? p.stroke)
    return resolveColor(raw ?? `var(--color-${p.dataKey})`) ?? resolveColor("var(--chart-1)")
  }

  const onTouch = (e: GestureResponderEvent) => {
    if (!n) return
    const { locationX, locationY } = e.nativeEvent
    const c = (vertical ? locationY : locationX) - catStart
    const i = pointScale ? Math.round(n > 1 ? (c / (catLen || 1)) * (n - 1) : 0) : Math.floor(c / (band || 1))
    const index = Math.min(n - 1, Math.max(0, i))
    setTouch({ index, x: locationX, y: locationY })
  }
  const active: TooltipState =
    touch ?? (tooltip?.defaultIndex !== undefined && size.width ? { index: tooltip.defaultIndex, x: vertical ? plot.left : catPos(tooltip.defaultIndex), y: vertical ? catPos(tooltip.defaultIndex) : plot.top } : null)
  const tooltipOn = !!tooltip && !tooltip.hide && !!active

  const nodes: React.ReactNode[] = []
  const overlays: React.ReactNode[] = []
  const labels: React.ReactNode[] = []

  const labelNodes = (s: Series, points: { x: number; y: number; w: number; h: number; value: unknown; datum: Datum; neg?: boolean }[]) => {
    const list = flatten(s.props.children).filter((c) => c.type === LabelList)
    for (const [li, l] of list.entries()) {
      const lp = l.props as LabelListProps
      const style = textStyle(lp.className)
      const size = lp.fontSize ?? style.fontSize ?? fontSize
      const off = lp.offset ?? 5
      const initial = lp.position ?? (s.kind === "bar" ? (vertical ? "right" : "top") : "top")
      points.forEach((p, i) => {
        // As in recharts, "top"/"bottom" ("left"/"right" in vertical layout) flip for bars of negative values.
        const flip = { top: "bottom", bottom: "top", left: "right", right: "left" } as const
        const pos = p.neg && (vertical ? initial === "left" || initial === "right" : initial === "top" || initial === "bottom") ? flip[initial as keyof typeof flip] : initial
        const value = lp.dataKey ? p.datum[lp.dataKey] : p.value
        const text = lp.formatter ? lp.formatter(value) : value
        let x = p.x + p.w / 2
        let y = p.y + p.h / 2
        let anchor: "start" | "middle" | "end" = "middle"
        if (pos === "top") y = p.y - off
        else if (pos === "bottom") y = p.y + p.h + off + size * 0.71
        else if (pos === "left") ((x = p.x - off), (anchor = "end"))
        else if (pos === "right") ((x = p.x + p.w + off), (anchor = "start"))
        else if (pos === "insideLeft") ((x = p.x + off), (anchor = "start"))
        else if (pos === "insideRight") ((x = p.x + p.w - off), (anchor = "end"))
        else if (pos === "insideTop") y = p.y + off + size * 0.71
        else if (pos === "insideBottom") y = p.y + p.h - off
        if (pos !== "top" && pos !== "bottom" && pos !== "insideTop" && pos !== "insideBottom") y += size * 0.355
        labels.push(
          <SvgText
            key={`label-${s.index}-${li}-${i}`}
            x={x}
            y={y}
            fontSize={size}
            fontWeight={style.fontWeight}
            fill={resolveColor(lp.fill) ?? style.fill ?? (tw("text-foreground").color as string | undefined)}
            fillOpacity={lp.fillOpacity}
            stroke={resolveColor(lp.stroke)}
            textAnchor={anchor}
          >
            {String(text ?? "")}
          </SvgText>
        )
      })
    }
  }

  if (size.width && size.height && n) {
    // Bars: one slot per stack (or unstacked bar) in each category band.
    const bars = shownSeries.filter((s): s is Extract<Series, { kind: "bar" }> => s.kind === "bar")
    const slots: string[] = []
    for (const s of bars) {
      const key = s.props.stackId !== undefined ? `stack:${s.props.stackId}` : `bar:${s.index}`
      if (!slots.includes(key)) slots.push(key)
    }
    const gapPx =
      typeof barCategoryGap === "string" && barCategoryGap.endsWith("%") ? (band * parseFloat(barCategoryGap)) / 100 : Number(barCategoryGap) || 0
    const groupW = Math.max(0, band - 2 * gapPx)
    for (const s of bars) {
      const key = s.props.stackId !== undefined ? `stack:${s.props.stackId}` : `bar:${s.index}`
      const slot = slots.indexOf(key)
      let barW = s.props.barSize ?? (groupW - (slots.length - 1) * barGap) / slots.length
      const cap = s.props.maxBarSize ?? maxBarSize
      if (cap != null) barW = Math.min(barW, cap)
      barW = Math.max(1, barW)
      const total = slots.length * barW + (slots.length - 1) * barGap
      const cells = flatten(s.props.children).filter((c) => c.type === Cell)
      const color = seriesColor(s)
      const points: Parameters<typeof labelNodes>[1] = []
      ranges.get(s)!.forEach(([a, b], i) => {
        const c0 = catStart + band * i + (band - total) / 2 + slot * (barW + barGap)
        const v0 = valPos(Math.min(a, b))
        const v1 = valPos(Math.max(a, b))
        const rect = vertical
          ? { x: v0, y: c0, w: Math.abs(v1 - v0), h: barW }
          : { x: c0, y: v1, w: barW, h: Math.abs(v0 - v1) }
        // A <Cell>'s fill, then the datum's `fill` (recharts spreads each datum into its bar's props).
        const fill = resolveColor(cells[i]?.props.fill ?? data[i].fill) ?? color
        points.push({ ...rect, value: data[i][s.props.dataKey], datum: data[i], neg: b < a })
        if (!rect.w || !rect.h) return
        const r = s.props.radius ?? 0
        nodes.push(
          s.props.shape ? (
            <React.Fragment key={`bar-${s.index}-${i}`}>
              {s.props.shape({
                index: i,
                x: rect.x,
                y: rect.y,
                width: rect.w,
                height: rect.h,
                radius: r,
                fill,
                fillOpacity: s.props.fillOpacity,
                stroke: s.props.stroke,
                strokeWidth: s.props.strokeWidth,
                payload: data[i],
                value: data[i][s.props.dataKey],
                dataKey: s.props.dataKey,
              })}
            </React.Fragment>
          ) : (
            <Path
              key={`bar-${s.index}-${i}`}
              d={roundedRect(rect.x, rect.y, rect.w, rect.h, r)}
              fill={fill}
              fillOpacity={s.props.fillOpacity}
              stroke={resolveColor(s.props.stroke)}
              strokeWidth={s.props.stroke ? s.props.strokeWidth : undefined}
            />
          )
        )
      })
      labelNodes(s, points)
    }

    // Areas first, then lines, in declaration order within each.
    for (const s of shownSeries) {
      if (s.kind === "bar") continue
      const p = s.props as AreaProps
      const color = seriesColor(s)
      const range = ranges.get(s)!
      const valid = data.map((d) => d[p.dataKey] != null)
      // Without connectNulls, a missing value splits the line.
      const segments: number[][] = []
      let current: number[] = []
      data.forEach((_, i) => {
        if (valid[i]) current.push(i)
        else if (!p.connectNulls && current.length) (segments.push(current), (current = []))
      })
      if (current.length) segments.push(current)
      const stroke = s.kind === "area" ? (resolveColor(p.stroke) ?? color) : color
      for (const [si, seg] of segments.entries()) {
        const upper = seg.map((i) => at(catPos(i), range[i][1]))
        if (s.kind === "area") {
          const lower = seg.map((i) => at(catPos(i), range[i][0])).reverse()
          const fill = p.fill?.startsWith("url(") ? p.fill : (resolveColor(p.fill) ?? color)
          nodes.unshift(
            <Path
              key={`area-${s.index}-${si}`}
              d={`${curvePath(upper, p.type)}${curvePath(lower, p.type, false)}Z`}
              fill={fill}
              fillOpacity={p.fillOpacity ?? 0.6}
            />
          )
        }
        nodes.push(
          <Path
            key={`line-${s.index}-${si}`}
            d={curvePath(upper, p.type)}
            fill="none"
            stroke={stroke}
            strokeWidth={p.strokeWidth ?? 1}
            strokeDasharray={p.strokeDasharray}
          />
        )
      }
      // recharts draws dots on lines by default (white fill, which shadcn keeps; its white stroke becomes transparent).
      const dot = p.dot ?? s.kind === "line"
      if (dot) {
        const dp = typeof dot === "object" ? dot : {}
        data.forEach((_, i) => {
          if (!valid[i]) return
          const [cx, cy] = at(catPos(i), range[i][1])
          overlays.push(
            <Circle
              key={`dot-${s.index}-${i}`}
              cx={cx}
              cy={cy}
              r={dp.r ?? 3}
              fill={resolveColor(dp.fill) ?? background}
              stroke={resolveColor(dp.stroke) ?? stroke}
              strokeWidth={dp.strokeWidth ?? p.strokeWidth ?? 1}
            />
          )
        })
      }
      if (tooltipOn && active && valid[active.index] && p.activeDot !== false) {
        const ap = typeof p.activeDot === "object" ? p.activeDot : {}
        const [cx, cy] = at(catPos(active.index), range[active.index][1])
        overlays.push(
          <Circle
            key={`active-${s.index}`}
            cx={cx}
            cy={cy}
            r={ap.r ?? 4}
            fill={resolveColor(ap.fill) ?? stroke}
            stroke={resolveColor(ap.stroke) ?? "transparent"}
            strokeWidth={ap.strokeWidth ?? 2}
          />
        )
      }
      labelNodes(
        s,
        data.map((d, i) => {
          const [x, y] = at(catPos(i), range[i][1])
          return { x, y, w: 0, h: 0, value: d[p.dataKey], datum: d }
        })
      )
    }
  }

  // Ticks.
  const tickStyle = (axis: AxisProps | undefined) => {
    const s = textStyle(axis?.className)
    return { fill: s.fill ?? muted, fontSize: s.fontSize ?? fontSize, fontWeight: s.fontWeight }
  }
  const fmt = (axis: AxisProps | undefined, v: unknown, i: number) => {
    const out = axis?.tickFormatter ? axis.tickFormatter(v, i) : typeof v === "number" ? v.toLocaleString() : v
    return out == null ? "" : String(out)
  }
  const catLabels = data.map((d, i) => fmt(catAxis, catKey ? d[catKey] : i, i))
  const valLabels = ticks.map((t, i) => fmt(valAxis, t, i))
  const catStyle = tickStyle(catAxis)
  const catShown = visibleTicks(
    data.map((_, i) => catPos(i)),
    catLabels.map((l) => (vertical ? catStyle.fontSize : l.length * catStyle.fontSize * 0.6)),
    catAxis?.interval,
    catAxis?.minTickGap ?? 5
  )

  const axisNodes: React.ReactNode[] = []
  const renderAxis = (axis: (AxisProps & { width?: number; height?: number }) | undefined, which: "x" | "y") => {
    if (!axis || axis.hide || !size.width) return
    const isCat = which === "x" ? !vertical : vertical
    const style = tickStyle(axis)
    const tickSize = axis.tickLine === false ? 0 : (axis.tickSize ?? 6)
    const margin = axis.tickMargin ?? 2
    const items = isCat
      ? data.map((_, i) => ({ pos: catPos(i), label: catLabels[i], show: catShown[i] }))
      : ticks.map((t, i) => ({ pos: valPos(t), label: valLabels[i], show: true }))
    if (axis.axisLine !== false) {
      axisNodes.push(
        which === "x" ? (
          <SvgLine key="x-axis" x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} stroke={axisColor} />
        ) : (
          <SvgLine key="y-axis" x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} stroke={axisColor} />
        )
      )
    }
    items.forEach((it, i) => {
      if (!it.show) return
      if (tickSize) {
        axisNodes.push(
          which === "x" ? (
            <SvgLine key={`xt-${i}`} x1={it.pos} x2={it.pos} y1={plot.bottom} y2={plot.bottom + tickSize} stroke={axisColor} />
          ) : (
            <SvgLine key={`yt-${i}`} x1={plot.left - tickSize} x2={plot.left} y1={it.pos} y2={it.pos} stroke={axisColor} />
          )
        )
      }
      axisNodes.push(
        which === "x" ? (
          <SvgText
            key={`xl-${i}`}
            x={it.pos}
            y={plot.bottom + tickSize + margin + style.fontSize * 0.71}
            fontSize={style.fontSize}
            fontWeight={style.fontWeight}
            fill={style.fill}
            textAnchor="middle"
          >
            {it.label}
          </SvgText>
        ) : (
          <SvgText
            key={`yl-${i}`}
            x={plot.left - tickSize - margin}
            y={it.pos + style.fontSize * 0.355}
            fontSize={style.fontSize}
            fontWeight={style.fontWeight}
            fill={style.fill}
            textAnchor="end"
          >
            {it.label}
          </SvgText>
        )
      )
    })
  }
  renderAxis(xAxis, "x")
  renderAxis(yAxis, "y")

  // Grid: horizontal lines at the Y ticks, vertical lines at the X ticks.
  const gridNodes: React.ReactNode[] = []
  if (grid && size.width && n) {
    const stroke = resolveColor(grid.stroke) ?? gridColor
    const yPositions = vertical ? data.map((_, i) => catPos(i)).filter((_, i) => catShown[i]) : ticks.map(valPos)
    const xPositions = vertical ? ticks.map(valPos) : data.map((_, i) => catPos(i)).filter((_, i) => catShown[i])
    if (grid.horizontal !== false) {
      yPositions.forEach((y, i) =>
        gridNodes.push(<SvgLine key={`gh-${i}`} x1={plot.left} x2={plot.right} y1={y} y2={y} stroke={stroke} strokeDasharray={grid.strokeDasharray} />)
      )
    }
    if (grid.vertical !== false) {
      xPositions.forEach((x, i) =>
        gridNodes.push(<SvgLine key={`gv-${i}`} x1={x} x2={x} y1={plot.top} y2={plot.bottom} stroke={stroke} strokeDasharray={grid.strokeDasharray} />)
      )
    }
  }

  // Cursor: the touched band for bars, a line for lines and areas.
  let cursor: React.ReactNode = null
  if (tooltipOn && active && tooltip?.cursor !== false && n) {
    const c = catPos(active.index)
    cursor = pointScale ? (
      vertical ? (
        <SvgLine x1={plot.left} x2={plot.right} y1={c} y2={c} stroke={cursorStroke} />
      ) : (
        <SvgLine x1={c} x2={c} y1={plot.top} y2={plot.bottom} stroke={cursorStroke} />
      )
    ) : vertical ? (
      <Rect x={plot.left} y={catStart + band * active.index} width={plotW} height={band} fill={cursorFill} />
    ) : (
      <Rect x={catStart + band * active.index} y={plot.top} width={band} height={plotH} fill={cursorFill} />
    )
  }

  const payloadAt = (i: number): ChartPayloadItem[] =>
    shownSeries.map((s) => {
      const cells = s.kind === "bar" ? flatten(s.props.children).filter((c) => c.type === Cell) : []
      const color = resolveColor(cells[i]?.props.fill ?? (s.kind === "bar" ? data[i]?.fill : undefined)) ?? seriesColor(s)
      return {
        dataKey: s.props.dataKey,
        name: s.props.name ?? s.props.dataKey,
        value: data[i]?.[s.props.dataKey],
        color,
        fill: color,
        payload: data[i],
      }
    })
  const legendPayload: ChartPayloadItem[] = series.map((s) => ({
    dataKey: s.props.dataKey,
    value: s.props.name ?? s.props.dataKey,
    color: seriesColor(s),
    type: s.props.hide ? "none" : undefined,
  }))

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
            {cursor}
            <G>{nodes}</G>
            <G>{axisNodes}</G>
            <G>{overlays}</G>
            <G>{labels}</G>
          </Svg>
        )}
        <TooltipOverlay
          declared={tooltip}
          state={active}
          width={size.width}
          height={size.height}
          payload={active ? payloadAt(active.index) : []}
          label={active && catKey ? data[active.index]?.[catKey] : undefined}
        />
      </View>
      <LegendSlot declared={legend} payload={legendPayload} position="bottom" />
    </View>
  )
}

function BarChart(props: CartesianChartProps) {
  return <CartesianChart chart="bar" {...props} />
}

function LineChart(props: CartesianChartProps) {
  return <CartesianChart chart="line" {...props} />
}

function AreaChart(props: CartesianChartProps) {
  return <CartesianChart chart="area" {...props} />
}

type PieChartProps = Omit<ViewProps, "children"> & {
  margin?: Margin
  accessibilityLayer?: boolean
  children?: React.ReactNode
}

const RAD = Math.PI / 180

/** A pie or donut sector between recharts angles (degrees, counter-clockwise from 3 o'clock). */
function sectorPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  if (Math.abs(a1 - a0) >= 359.999) {
    // A full ring: two half arcs.
    const mid = a0 + (a1 - a0) / 2
    return sectorPath(cx, cy, r0, r1, a0, mid) + sectorPath(cx, cy, r0, r1, mid, a1)
  }
  const p = (r: number, a: number) => `${cx + r * Math.cos(a * RAD)},${cy - r * Math.sin(a * RAD)}`
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  const sweep = a1 > a0 ? 0 : 1
  const outer = `M${p(r1, a0)}A${r1},${r1} 0 ${large} ${sweep} ${p(r1, a1)}`
  return r0 > 0 ? `${outer}L${p(r0, a1)}A${r0},${r0} 0 ${large} ${1 - sweep} ${p(r0, a0)}Z` : `${outer}L${cx},${cy}Z`
}

function percentOf(value: number | string | undefined, total: number, fallback: number) {
  if (value === undefined) return fallback
  if (typeof value === "number") return value
  return value.trim().endsWith("%") ? (parseFloat(value) / 100) * total : parseFloat(value) || fallback
}

function PieChart({ margin, accessibilityLayer: _accessibilityLayer, className, children, ...props }: PieChartProps) {
  const tw = useTw()
  const resolveColor = useColorResolver()
  const textStyle = useSvgTextStyle()
  const [size, onLayout] = useSize()
  const parts = flatten(children)
  const { tooltip, legend } = useDeclared(parts)
  const extra = useSvgChildren(parts)
  const resolveNode = useSvgNodeResolver()
  const [touch, setTouch] = React.useState<{ pie: number; index: number; x: number; y: number } | null>(null)
  const foreground = tw("text-foreground").color as string | undefined
  const fontSize = (tw("text-xs").fontSize as number | undefined) ?? 12

  const m = { top: margin?.top ?? 5, right: margin?.right ?? 5, bottom: margin?.bottom ?? 5, left: margin?.left ?? 5 }
  const w = Math.max(0, size.width - m.left - m.right)
  const h = Math.max(0, size.height - m.top - m.bottom)
  const maxRadius = Math.min(w, h) / 2

  const pies = parts
    .filter((p) => p.type === Pie)
    .map((el) => {
      const p = el.props as PieProps
      const data = p.data ?? []
      const nameKey = p.nameKey ?? "name"
      const cells = flatten(p.children).filter((c) => c.type === Cell)
      const cx = m.left + percentOf(p.cx ?? "50%", w, w / 2)
      const cy = m.top + percentOf(p.cy ?? "50%", h, h / 2)
      const r0 = percentOf(p.innerRadius, maxRadius, 0)
      const r1 = percentOf(p.outerRadius ?? "80%", maxRadius, maxRadius * 0.8)
      const startAngle = p.startAngle ?? 0
      const endAngle = p.endAngle ?? 360
      const padding = p.paddingAngle ?? 0
      const sign = Math.sign(endAngle - startAngle) || 1
      const values = data.map((d) => Math.max(0, Number(d[p.dataKey]) || 0))
      const sum = values.reduce((a, b) => a + b, 0)
      const nonZero = values.filter((v) => v > 0).length
      const available = Math.max(0, Math.min(360, Math.abs(endAngle - startAngle)) - (nonZero > 1 || Math.abs(endAngle - startAngle) < 360 ? padding * nonZero : 0))
      let angle = startAngle
      const sectors = data.map((d, i) => {
        const fill = resolveColor(cells[i]?.props.fill ?? d.fill ?? p.fill ?? `var(--color-${String(d[nameKey])})`) ?? resolveColor("var(--chart-1)")
        const sweep = sum ? (values[i] / sum) * available : 0
        const a0 = i === 0 ? angle : angle + sign * padding
        const a1 = a0 + sign * sweep
        angle = a1
        return { d, i, a0, a1, fill }
      })
      return { props: p, data, nameKey, cells, cx, cy, r0, r1, startAngle, endAngle, sectors, sum }
    })

  const onTouch = (e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent
    for (const [pi, pie] of pies.entries()) {
      const dx = x - pie.cx
      const dy = pie.cy - y
      const r = Math.hypot(dx, dy)
      if (r < pie.r0 || r > pie.r1 + 4) continue
      const a = Math.atan2(dy, dx) / RAD
      for (const s of pie.sectors) {
        const lo = Math.min(s.a0, s.a1)
        const hi = Math.max(s.a0, s.a1)
        const norm = ((((a - lo) % 360) + 360) % 360) + lo
        if (norm >= lo && norm <= hi) {
          setTouch({ pie: pi, index: s.i, x, y })
          return
        }
      }
    }
    setTouch(null)
  }

  const active =
    touch ??
    (tooltip?.defaultIndex !== undefined && pies[0]?.sectors[tooltip.defaultIndex]
      ? { pie: 0, index: tooltip.defaultIndex, x: pies[0].cx, y: pies[0].cy }
      : null)

  const payload: ChartPayloadItem[] = (() => {
    if (!active) return []
    const pie = pies[active.pie]
    const s = pie?.sectors[active.index]
    if (!pie || !s) return []
    return [
      {
        dataKey: pie.props.dataKey,
        name: s.d[pie.nameKey],
        value: s.d[pie.props.dataKey],
        color: s.fill,
        fill: s.fill,
        payload: { ...s.d, fill: s.fill },
      },
    ]
  })()
  const legendPayload: ChartPayloadItem[] = (pies[0]?.sectors ?? []).map((s) => ({
    value: s.d[pies[0].nameKey],
    color: s.fill,
    payload: s.d,
  }))

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
      >
        {size.width > 0 && (
          <Svg width={size.width} height={size.height} fontFamily={svgFontFamily}>
            {extra}
            {pies.map((pie, pi) => {
              const p = pie.props
              const label = flatten(p.children).find((c) => c.type === ChartLabel)?.props as ChartLabelProps | undefined
              const viewBox: PieViewBox = { cx: pie.cx, cy: pie.cy, innerRadius: pie.r0, outerRadius: pie.r1, startAngle: pie.startAngle, endAngle: pie.endAngle }
              const labelStyle = textStyle(label?.className)
              const labelLists = flatten(p.children)
                .filter((c) => c.type === LabelList)
                .map((c) => c.props as LabelListProps)
              return (
                <G key={pi}>
                  {pie.sectors.map((s) => {
                    if (s.a0 === s.a1) return null
                    const midAngle = (s.a0 + s.a1) / 2
                    const mid = midAngle * RAD
                    const cos = Math.cos(mid)
                    const sin = -Math.sin(mid)
                    const sector: PieSectorShapeProps = {
                      index: s.i,
                      isActive: active?.pie === pi && active.index === s.i,
                      cx: pie.cx,
                      cy: pie.cy,
                      innerRadius: pie.r0,
                      outerRadius: pie.r1,
                      startAngle: s.a0,
                      endAngle: s.a1,
                      midAngle,
                      fill: s.fill,
                      // recharts' white sector stroke is made transparent by shadcn.
                      stroke: resolveColor(pie.cells[s.i]?.props.stroke ?? p.stroke) ?? "transparent",
                      strokeWidth: p.strokeWidth ?? 1,
                      payload: s.d,
                      value: s.d[p.dataKey],
                      name: s.d[pie.nameKey],
                      percent: pie.sum ? (Number(s.d[p.dataKey]) || 0) / pie.sum : 0,
                    }
                    const { isActive: _isActive, ...labelBase } = sector
                    return (
                      <G key={s.i}>
                        {p.shape ? p.shape(sector) : <Sector {...sector} />}
                        {p.label && p.labelLine !== false && (
                          <SvgLine
                            x1={pie.cx + pie.r1 * cos}
                            y1={pie.cy + pie.r1 * sin}
                            x2={pie.cx + (pie.r1 + 20) * cos}
                            y2={pie.cy + (pie.r1 + 20) * sin}
                            stroke={s.fill}
                          />
                        )}
                        {typeof p.label === "function"
                          ? resolveNode(
                              p.label({
                                ...labelBase,
                                x: pie.cx + (pie.r1 + 20) * cos,
                                y: pie.cy + (pie.r1 + 20) * sin,
                                textAnchor: cos > 1e-6 ? "start" : cos < -1e-6 ? "end" : "middle",
                                dominantBaseline: "central",
                              })
                            )
                          : p.label && (
                              <SvgText
                                x={pie.cx + (pie.r1 + 22) * cos}
                                y={pie.cy + (pie.r1 + 22) * sin + fontSize * 0.355}
                                fontSize={fontSize}
                                fill={foreground}
                                textAnchor={cos >= 0 ? "start" : "end"}
                              >
                                {String(s.d[p.dataKey])}
                              </SvgText>
                            )}
                        {labelLists.map((lp, li) => {
                          // recharts' polar labels default to the middle of the sector.
                          const style = textStyle(lp.className)
                          const size = lp.fontSize ?? style.fontSize ?? fontSize
                          const r = (pie.r0 + pie.r1) / 2
                          const value = lp.dataKey ? s.d[lp.dataKey] : s.d[p.dataKey]
                          const text = lp.formatter ? lp.formatter(value) : value
                          return (
                            <SvgText
                              key={`label-${li}`}
                              x={pie.cx + r * cos}
                              y={pie.cy + r * sin + size * 0.355}
                              fontSize={size}
                              fontWeight={style.fontWeight}
                              fill={resolveColor(lp.fill) ?? style.fill ?? foreground}
                              fillOpacity={lp.fillOpacity}
                              stroke={lp.stroke === "none" ? undefined : resolveColor(lp.stroke)}
                              textAnchor="middle"
                            >
                              {String(text ?? "")}
                            </SvgText>
                          )
                        })}
                      </G>
                    )
                  })}
                  {label?.content
                    ? resolveNode(label.content({ viewBox }))
                    : label?.value != null && (
                        <SvgText
                          x={pie.cx}
                          y={pie.cy + (label.fontSize ?? labelStyle.fontSize ?? fontSize) * 0.355}
                          fontSize={label.fontSize ?? labelStyle.fontSize ?? fontSize}
                          fontWeight={labelStyle.fontWeight}
                          fill={resolveColor(label.fill) ?? labelStyle.fill ?? foreground}
                          textAnchor="middle"
                        >
                          {String(label.value)}
                        </SvgText>
                      )}
                </G>
              )
            })}
          </Svg>
        )}
        <TooltipOverlay declared={tooltip} state={active} width={size.width} height={size.height} payload={payload} />
      </View>
      <LegendSlot declared={legend} payload={legendPayload} position="bottom" />
    </View>
  )
}

export type { ChartConfig }

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  useChart,
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  Bar,
  Line,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ChartLabel,
  Rectangle,
  Sector,
  type ChartPayloadItem,
  type ChartTooltipContentProps,
  type ChartLegendContentProps,
  type CartesianChartProps,
  type PieChartProps,
  type BarProps,
  type LineProps,
  type AreaProps,
  type PieProps,
  type AxisProps,
  type LabelListProps,
  type ChartLabelProps,
  type RectangleProps,
  type BarShapeProps,
  type SectorProps,
  type PieSectorShapeProps,
  type PieLabelRenderProps,
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
} from "./chart-polar"

