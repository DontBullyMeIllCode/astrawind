import * as React from "react"
import { Link, useLocalSearchParams } from "expo-router"
import { ScrollView, Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Button } from "@astrawind/ui/button"
import { ChartDisplay } from "@/components/charts/chart-display"
import { BoxLink } from "@/components/link"
import { Announcement, PageActions, PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Seo } from "@/components/seo"
import { SiteFooter } from "@/components/site-footer"
import { charts as chartComponents } from "@/generated/previews"
import { chartDocs, chartTypes } from "@/lib/charts"

export async function generateStaticParams(): Promise<{ type: string }[]> {
  return chartTypes.map((t) => ({ type: t.type }))
}

const title = "Beautiful Charts & Graphs"
const description =
  "A collection of ready-to-use chart components built with react-native-svg and a recharts-style API. From basic charts to rich data displays, copy and paste into your apps."

/** The chart type tabs, as links. */
function ChartsNav({ active }: { active: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1 px-4 lg:px-6">
      {chartTypes.map((t) => (
        <BoxLink
          key={t.type}
          href={`/charts/${t.type}`}
          className={cn("h-7 justify-center rounded-full px-4", active === t.type && "bg-muted")}
        >
          <Text className={cn("text-sm font-medium", active === t.type ? "text-foreground" : "text-muted-foreground")}>
            {t.label}
          </Text>
        </BoxLink>
      ))}
    </ScrollView>
  )
}

export default function ChartsPage() {
  const { type } = useLocalSearchParams<{ type: string }>()
  const current = chartTypes.find((t) => t.type === type) ?? chartTypes[0]
  const items = chartDocs.filter((c) => c.type === current.type)
  return (
    <ScrollView className="flex-1">
      <Seo title={`${current.label} - astrawind/ui`} description={current.description} path={`/charts/${current.type}`} />
      <PageHeader>
        <Announcement href="/docs/components/chart">Charts for React Native</Announcement>
        <PageHeaderHeading>{title}</PageHeaderHeading>
        <PageHeaderDescription>{description}</PageHeaderDescription>
        <PageActions>
          <Button size="sm" className="h-[35px]">
            Browse Charts
          </Button>
          <Link href="/docs/components/chart" asChild>
            <Button size="sm" variant="secondary">
              Documentation
            </Button>
          </Link>
        </PageActions>
      </PageHeader>
      <View className="border-b py-3">
        <ChartsNav active={current.type} />
      </View>
      <View className="w-full max-w-[1400px] flex-row flex-wrap gap-4 self-center p-4 lg:gap-6 lg:p-6">
        {items.length === 0 && <Text className="text-muted-foreground">No charts of this type yet.</Text>}
        {items.map((chart) => {
          const Component = chartComponents[chart.id]
          if (!Component) return null
          return (
            <ChartDisplay
              key={chart.id}
              chart={chart}
              component={Component}
              className={chart.fullWidth ? "w-full" : "w-full md:w-[48.5%] lg:w-[31.8%]"}
            />
          )
        })}
      </View>
      <SiteFooter />
    </ScrollView>
  )
}
