import { Text, View } from "@astrawind/css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Separator } from "@astrawind/ui/separator"

const chartData = [
  { hour: "6a", usage: 1.2 },
  { hour: "8a", usage: 2.8 },
  { hour: "10a", usage: 3.1 },
  { hour: "12p", usage: 2.4 },
  { hour: "2p", usage: 3.4 },
  { hour: "4p", usage: 2.9 },
  { hour: "6p", usage: 3.8 },
  { hour: "8p", usage: 3.2 },
]

export function PowerUsage() {
  const maxUsage = Math.max(...chartData.map((item) => item.usage))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Power Usage</CardTitle>
        <CardDescription>Whole Home</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <View className="flex h-[140px] w-full items-end gap-2" role="img" aria-label="Power usage by hour">
          {chartData.map((item) => (
            <View key={item.hour} className="flex h-full flex-1 flex-col justify-end gap-1.5">
              {/* `shrink`: CSS flex items shrink by default, so the tallest bar leaves room for the label. */}
              <View
                className="min-h-2 shrink rounded-t bg-chart-2"
                style={{ height: `${(item.usage / maxUsage) * 100}%` }}
              />
              <Text className="text-center text-xs text-muted-foreground">{item.hour}</Text>
            </View>
          ))}
        </View>
        <Separator />
        <View className="grid grid-cols-2 gap-4">
          <View className="flex flex-col gap-0.5">
            <Text className="text-sm text-muted-foreground">Currently Using</Text>
            <Text className="text-lg font-semibold tabular-nums">3.4 kW</Text>
          </View>
          <View className="flex flex-col gap-0.5">
            <Text className="text-sm text-muted-foreground">Solar Gen</Text>
            <Text className="text-lg font-semibold tabular-nums">+1.2 kW</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  )
}
