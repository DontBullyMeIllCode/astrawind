import { TrendingUp } from "lucide-react-native"
import { Text as SvgText, TSpan } from "react-native-svg"
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
  ChartContainer,
  ChartLabel,
  ChartTooltip,
  ChartTooltipContent,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  type ChartConfig,
} from "@astrawind/ui/chart"
import { Icon } from "@astrawind/ui/icon"

export const description = "A radial chart with stacked sections"

const chartData = [{ month: "january", mobile: 570, desktop: 1260 }]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartRadialStacked() {
  const totalVisitors = chartData[0].desktop + chartData[0].mobile

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Stacked</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={110}
          >
            <RadialBar
              dataKey="mobile"
              fill="var(--color-mobile)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="desktop"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-desktop)"
              className="stroke-transparent stroke-2"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <ChartLabel
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <SvgText x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <TSpan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          fill="var(--foreground)"
                          fontSize={24}
                          fontWeight="bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </TSpan>
                        <TSpan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          fill="var(--muted-foreground)"
                        >
                          Visitors
                        </TSpan>
                      </SvgText>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <View className="flex items-center gap-2 leading-none font-medium">
          <Text>Trending up by 5.2% this month</Text>
          <Icon as={TrendingUp} className="h-4 w-4" />
        </View>
        <Text className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </Text>
      </CardFooter>
    </Card>
  )
}
