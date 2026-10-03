import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Item, ItemContent, ItemDescription } from "@astrawind/ui/item"
import { cn } from "@astrawind/ui"

const chartData = [
  { month: "Dec", amount: 800 },
  { month: "Jan", amount: 1100 },
  { month: "Feb", amount: 900 },
  { month: "Mar", amount: 1300 },
  { month: "Apr", amount: 750 },
]

// `data-[index=N]:bg-chart-N`, picked by index.
const BAR_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

export function ContributionHistory() {
  const maxAmount = Math.max(...chartData.map((item) => item.amount))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution History</CardTitle>
        <CardDescription>Last 6 months of activity</CardDescription>
      </CardHeader>
      <CardContent>
        <View
          className="flex h-[200px] w-full items-end gap-3"
          role="img"
          aria-label="Last 6 months of contribution activity"
        >
          {chartData.map((item, index) => (
            <View key={item.month} className="flex h-full flex-1 flex-col justify-end gap-2">
              {/* `shrink`: CSS flex items shrink by default, so the tallest bar leaves room for the label. */}
              <View
                data-index={index}
                className={cn("min-h-2 shrink rounded-lg", BAR_COLORS[index])}
                style={{ height: `${(item.amount / maxAmount) * 100}%` }}
              />
              <Text className="text-center text-xs text-muted-foreground">{item.month}</Text>
            </View>
          ))}
        </View>
      </CardContent>
      <CardContent>
        {/* `grid grid-cols-1 xl:grid-cols-2` with a second item shown on xl: a column that becomes a row. */}
        <View className="flex w-full flex-col gap-3 xl:flex-row">
          <Item variant="muted" className="flex-col items-stretch xl:flex-1">
            <ItemContent className="gap-1">
              <ItemDescription className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Upcoming
              </ItemDescription>
              <Text className="text-base font-semibold">May 2024</Text>
              <Text className="text-sm text-muted-foreground">Scheduled</Text>
            </ItemContent>
          </Item>
          <Item variant="muted" className="hidden flex-col items-stretch xl:flex xl:flex-1">
            <ItemContent className="gap-1">
              <ItemDescription className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Savings Plan
              </ItemDescription>
              <Text className="text-base font-semibold">Accelerated</Text>
              <Text className="text-sm text-muted-foreground">Recurring</Text>
            </ItemContent>
          </Item>
        </View>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Full Report</Button>
      </CardFooter>
    </Card>
  )
}
