import { TrendingUp } from "lucide-react-native"
import { Text, View } from "@astrawind/css"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@astrawind/ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
  YAxis,
  type ChartConfig,
} from "@astrawind/ui/chart"
import { Icon } from "@astrawind/ui/icon"

export const description = "A stacked area chart with expand stacking"

const chartData = [
  { month: "January", desktop: 186, mobile: 80, other: 45 },
  { month: "February", desktop: 305, mobile: 200, other: 100 },
  { month: "March", desktop: 237, mobile: 120, other: 150 },
  { month: "April", desktop: 73, mobile: 190, other: 50 },
  { month: "May", desktop: 209, mobile: 130, other: 100 },
  { month: "June", desktop: 214, mobile: 140, other: 160 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
  other: {
    label: "Other",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

// recharts' `stackOffset="expand"` isn't supported: stack each month's share
// (in %) on a fixed 0-100 axis instead.
const expandedData = chartData.map(({ month, ...values }) => {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0)
  return {
    month,
    desktop: Math.round((values.desktop / total) * 1000) / 10,
    mobile: Math.round((values.mobile / total) * 1000) / 10,
    other: Math.round((values.other / total) * 1000) / 10,
  }
})

export function ChartAreaStackedExpand() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Stacked Expanded</CardTitle>
        <CardDescription>
          Showing total visitors for the last 6months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={expandedData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis hide domain={[0, 100]} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="other"
              type="natural"
              fill="var(--color-other)"
              fillOpacity={0.1}
              stroke="var(--color-other)"
              stackId="a"
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="var(--color-mobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <View className="flex w-full items-start gap-2 text-sm">
          <View className="grid gap-2">
            <View className="flex items-center gap-2 leading-none font-medium">
              <Text>Trending up by 5.2% this month</Text>
              <Icon as={TrendingUp} className="h-4 w-4" />
            </View>
            <Text className="flex items-center gap-2 leading-none text-muted-foreground">
              January - June 2024
            </Text>
          </View>
        </View>
      </CardFooter>
    </Card>
  )
}
