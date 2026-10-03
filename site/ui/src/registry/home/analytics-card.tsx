import Svg, { Path } from "react-native-svg"
import { useTw, View } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"
import { Button } from "@astrawind/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@astrawind/ui/card"

const areaPath = "M0 52L18 40L36 46L54 70L72 50L100 49V86H0Z"
const strokePath = "M0 52L18 40L36 46L54 70L72 50L100 49"

// Upstream uses the Card's `size="sm"` (not in new-york-v4); `pb-0` keeps the chart flush with the bottom edge.
export function AnalyticsCard() {
  const tw = useTw()
  const color = tw("text-chart-1").color as string | undefined
  return (
    <Card className="mx-auto w-full max-w-sm overflow-hidden pb-0">
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <View className="flex items-center gap-2">
          <CardDescription>418.2K Visitors</CardDescription>
          <Badge>+10%</Badge>
        </View>
        <CardAction>
          <Button variant="outline" size="sm">
            View Analytics
          </Button>
        </CardAction>
      </CardHeader>
      <View className="aspect-[1/0.35] w-full" role="img" aria-label="Visitor trend">
        <Svg width="100%" height="100%" viewBox="0 0 100 86" preserveAspectRatio="none">
          <Path d={areaPath} fill={color} opacity={0.28} />
          <Path d={strokePath} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </Svg>
      </View>
    </Card>
  )
}
