import * as React from "react"
import { Defs, LinearGradient, Stop } from "react-native-svg"
import { View } from "@astrawind/css"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartLabel,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
  type ChartConfig,
} from "@astrawind/ui/chart"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

const pieData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" },
]

const pieConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
  firefox: { label: "Firefox", color: "var(--chart-3)" },
  edge: { label: "Edge", color: "var(--chart-4)" },
  other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig

export default function ChartExample() {
  const total = pieData.reduce((sum, d) => sum + d.visitors, 0)

  return (
    <View className="flex-col gap-8">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
          <ChartTooltip content={<ChartTooltipContent />} defaultIndex={1} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}>
            <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
          </Bar>
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>

      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: -20 }}>
          <XAxis type="number" dataKey="desktop" hide />
          <YAxis dataKey="month" type="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" radius={[4, 0, 0, 4]} />
          <Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>

      <ChartContainer config={chartConfig}>
        <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} defaultIndex={2} />
          <Defs>
            <LinearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
              <Stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
            </LinearGradient>
          </Defs>
          <Area dataKey="mobile" type="natural" fill="var(--color-mobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
          <Area dataKey="desktop" type="natural" fill="url(#fillDesktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
        </AreaChart>
      </ChartContainer>

      <ChartContainer config={chartConfig}>
        <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
          <YAxis tickLine={false} axisLine={false} tickCount={3} width={32} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} defaultIndex={3} />
          <Line dataKey="desktop" type="natural" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
          <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={{ fill: "var(--color-mobile)" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ChartContainer>

      <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px]">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} defaultIndex={0} />
          <Pie data={pieData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
            <ChartLabel value={total.toLocaleString()} className="fill-foreground text-3xl font-bold" />
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="browser" />} />
        </PieChart>
      </ChartContainer>

      <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px]">
        <PieChart>
          <Pie data={pieData} dataKey="visitors" nameKey="browser" label />
        </PieChart>
      </ChartContainer>

      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
        <RadarChart data={chartData}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} defaultIndex={1} />
          <PolarAngleAxis dataKey="month" />
          <PolarGrid />
          <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} dot={{ r: 4, fillOpacity: 1 }} />
          <Radar dataKey="mobile" fill="var(--color-mobile)" />
          <ChartLegend className="mt-8" content={<ChartLegendContent />} />
        </RadarChart>
      </ChartContainer>

      <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px]">
        <RadialBarChart data={pieData} startAngle={-90} endAngle={380} innerRadius={30} outerRadius={110}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="browser" />} defaultIndex={0} />
          <PolarGrid gridType="circle" />
          <RadialBar dataKey="visitors" background cornerRadius={4}>
            <LabelList position="insideStart" dataKey="browser" className="fill-white capitalize" fontSize={11} />
          </RadialBar>
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <ChartLabel value={total.toLocaleString()} className="fill-foreground text-xl font-bold" />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
    </View>
  )
}
