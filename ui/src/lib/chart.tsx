import * as React from "react"
import { displayColor, Text, useAstraWind, useTw, View } from "@astrawind/css"
import { renderTextChildren } from "./children"
import { cn } from "./utils"

/**
 * What components/chart.tsx and components/chart-polar.tsx share: the chart
 * context, ChartContainer, tooltip and legend, and the marker components both
 * read from their children. Lives here so neither chart file imports the other.
 */

type ViewProps = React.ComponentProps<typeof View>

// Format: { THEME_NAME: CSS_SELECTOR }
const themes = { light: "", dark: ".dark" } as const

type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof themes, string> })
>

const INITIAL_DIMENSION = { width: 320, height: 200 } as const

type ChartContextProps = {
  config: ChartConfig
  /** Size the chart draws at before it's measured. */
  initialDimension: { width: number; height: number }
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

/** `[--color-desktop:var(--chart-1)]` classes: what <ChartStyle> writes into a stylesheet on the web. */
function chartVars(config: ChartConfig, theme: keyof typeof themes) {
  return Object.entries(config)
    .map(([key, item]) => {
      const color = item.theme?.[theme] ?? item.color
      return color ? `[--color-${key}:${color.trim().replace(/\s+/g, "_")}]` : ""
    })
    .filter(Boolean)
    .join(" ")
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: ViewProps & {
  config: ChartConfig
  children?: React.ReactNode
  /** Size the chart draws at before its first layout. */
  initialDimension?: { width: number; height: number }
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`
  const { colorScheme } = useAstraWind()
  const { width, height } = initialDimension
  const context = React.useMemo(() => ({ config, initialDimension: { width, height } }), [config, width, height])

  return (
    <ChartContext.Provider value={context}>
      <View
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          // The `[&_.recharts-*]` selectors are applied by the chart primitives below
          // (muted tick text, border/50 grid lines, muted cursor, no white strokes).
          "flex aspect-video justify-center text-xs",
          chartVars(config, colorScheme),
          className
        )}
        {...props}
      >
        {children}
      </View>
    </ChartContext.Provider>
  )
}

/** On the web this writes the `--color-*` variables into a <style>; ChartContainer sets them on native. */
const ChartStyle = (_props: { id: string; config: ChartConfig }) => {
  return null
}

// ---------------------------------------------------------------------------
// Tooltip and legend
// ---------------------------------------------------------------------------

type Datum = Record<string, any>

type ChartPayloadItem = {
  dataKey?: string | number
  name?: string | number
  value?: any
  color?: string
  fill?: string
  type?: string
  payload?: Datum
}

type ChartTooltipProps = {
  /** The element to render, usually <ChartTooltipContent />. */
  content?: React.ReactElement<any>
  /** Highlights the touched category. Defaults to true. */
  cursor?: boolean
  /** Index shown before the chart is touched. */
  defaultIndex?: number
  hide?: boolean
}

/** recharts' <Tooltip>: declares the tooltip of the chart it's in. Renders nothing by itself. */
function ChartTooltip(_props: ChartTooltipProps) {
  return null
}

type ChartTooltipContentProps = Omit<ViewProps, "children"> & {
  active?: boolean
  payload?: ChartPayloadItem[]
  label?: React.ReactNode
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  labelFormatter?: (label: React.ReactNode, payload: ChartPayloadItem[]) => React.ReactNode
  labelClassName?: string
  formatter?: (value: any, name: string | number, item: ChartPayloadItem, index: number, payload: Datum | undefined) => React.ReactNode
  color?: string
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  ...props
}: ChartTooltipContentProps) {
  const { config } = useChart()
  const resolveColor = useColorResolver()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value = !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : itemConfig?.label

    if (labelFormatter) {
      return <View className="flex-row">{renderTextChildren(labelFormatter(value, payload), cn("font-medium", labelClassName))}</View>
    }

    if (!value) {
      return null
    }

    return <View className="flex-row">{renderTextChildren(value, cn("font-medium", labelClassName))}</View>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <View
      className={cn(
        // `items-start` aligns grid rows on the block axis on the web; here it would
        // shrink them horizontally, so rows stretch.
        "grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
      {...props}
    >
      {!nestLabel ? tooltipLabel : null}
      <View className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = resolveColor(color ?? item.payload?.fill ?? item.color)

            return (
              <View
                key={index}
                className={cn(
                  // `[&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground`: on the icon's wrapper below.
                  "flex w-full flex-wrap items-stretch gap-2",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  renderTextChildren(formatter(item.value, item.name, item, index, item.payload))
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <View className="text-muted-foreground [&_svg]:size-2.5">
                        <itemConfig.icon />
                      </View>
                    ) : (
                      !hideIndicator && (
                        <View
                          className={cn("shrink-0 rounded-[2px]", {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          })}
                          // `border-(--color-border) bg-(--color-bg)` with the item's color.
                          style={{
                            borderColor: indicatorColor,
                            backgroundColor: indicator === "dashed" ? "transparent" : indicatorColor,
                          }}
                        />
                      )
                    )}
                    <View className={cn("flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center")}>
                      <View className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        {renderTextChildren(itemConfig?.label ?? item.name, "text-muted-foreground")}
                      </View>
                      {item.value != null && (
                        <Text className="font-mono font-medium text-foreground tabular-nums">
                          {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            )
          })}
      </View>
    </View>
  )
}

type ChartLegendProps = {
  /** The element to render, usually <ChartLegendContent />. */
  content?: React.ReactElement<any>
  verticalAlign?: "top" | "bottom"
  /** Added to the content's className. */
  className?: string
}

/** recharts' <Legend>: declares the legend of the chart it's in. Renders nothing by itself. */
function ChartLegend(_props: ChartLegendProps) {
  return null
}

type ChartLegendContentProps = ViewProps & {
  hideIcon?: boolean
  nameKey?: string
  payload?: ChartPayloadItem[]
  verticalAlign?: "top" | "bottom"
}

function ChartLegendContent({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...props }: ChartLegendContentProps) {
  const { config } = useChart()
  const resolveColor = useColorResolver()

  if (!payload?.length) {
    return null
  }

  return (
    <View className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)} {...props}>
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <View key={index} className={cn("flex items-center gap-1.5")}>
              {itemConfig?.icon && !hideIcon ? (
                // `[&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground`
                <View className="text-muted-foreground [&_svg]:size-3">
                  <itemConfig.icon />
                </View>
              ) : (
                <View
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: resolveColor(item.color),
                  }}
                />
              )}
              {renderTextChildren(itemConfig?.label)}
            </View>
          )
        })}
    </View>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? (payload.payload as Datum) : undefined

  let configLabelKey: string = key

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key] as string
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}


/** recharts' <Cell>: per-item props for a Bar or Pie. */
function Cell(_props: { fill?: string; stroke?: string }) {
  return null
}

type LabelListProps = {
  dataKey?: string
  position?: "top" | "bottom" | "left" | "right" | "inside" | "insideLeft" | "insideRight" | "insideTop" | "insideBottom" | "center"
    // On a RadialBar (./chart-polar).
    | "insideStart" | "insideEnd" | "end" | "outside"
  offset?: number
  formatter?: (value: any) => React.ReactNode
  className?: string
  fontSize?: number
  fill?: string
  fillOpacity?: number
  stroke?: string
}

/** recharts' <LabelList>: value labels on a Bar, Line, Area or Pie. */
function LabelList(_props: LabelListProps) {
  return null
}

type PieViewBox = { cx: number; cy: number; innerRadius: number; outerRadius: number; startAngle: number; endAngle: number }

type ChartLabelProps = {
  value?: React.ReactNode
  position?: "center"
  /** Renders react-native-svg elements (e.g. <Text>/<TSpan>) from the pie's geometry. */
  content?: (props: { viewBox: PieViewBox }) => React.ReactNode
  className?: string
  fontSize?: number
  fill?: string
}

/** recharts' <Label> inside a <Pie>, for a donut's center text. */
function ChartLabel(_props: ChartLabelProps) {
  return null
}

/** Resolves CSS colors and `var(--color-*)` (set by ChartContainer) to native colors. */
function useColorResolver() {
  const tw = useTw()
  return React.useCallback(
    (value: string | undefined): string | undefined => {
      if (!value || value === "none" || value === "transparent" || value.startsWith("url(")) return value
      const c = tw(`bg-[${value.trim().replace(/\s+/g, "_")}]`).backgroundColor
      // On the web, the wide-gamut color an oklch theme color stands for (as CSS shows it).
      return typeof c === "string" ? displayColor(c) : undefined
    },
    [tw]
  )
}


export {
  INITIAL_DIMENSION,
  useColorResolver,
  ChartContext,
  useChart,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  Cell,
  LabelList,
  ChartLabel,
  type ViewProps,
  type ChartConfig,
  type Datum,
  type ChartPayloadItem,
  type ChartTooltipProps,
  type ChartTooltipContentProps,
  type ChartLegendProps,
  type ChartLegendContentProps,
  type LabelListProps,
  type PieViewBox,
  type ChartLabelProps,
}
