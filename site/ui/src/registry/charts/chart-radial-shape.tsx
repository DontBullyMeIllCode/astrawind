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
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  type ChartConfig,
} from "@astrawind/ui/chart"
import { Icon } from "@astrawind/ui/icon"

export const description = "A radial chart with a custom shape"

const chartData = [
  { browser: "safari", visitors: 1260, fill: "var(--color-safari)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartRadialShape() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Shape</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={100}
            innerRadius={65}
            outerRadius={95}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="visitors" background />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <ChartLabel
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <SvgText
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        <TSpan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          fill="var(--foreground)"
                          fontSize={36}
                          fontWeight="bold"
                        >
                          {chartData[0].visitors.toLocaleString()}
                        </TSpan>
                        <TSpan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
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
