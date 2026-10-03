import { Text, View } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Item, ItemContent } from "@astrawind/ui/item"
import { Separator } from "@astrawind/ui/separator"

const netRoyalties = 1248.75
const processingFee = 37.46
const totalClaimable = netRoyalties - processingFee

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export function ClaimableBalance() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Claimable Balance</CardDescription>
        <CardTitle className="text-4xl tabular-nums">${formatCurrency(totalClaimable)}</CardTitle>
        <Badge variant="outline">
          <View className="size-2 rounded-full bg-yellow-500" />
          Pending Setup
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <Item variant="muted" className="flex-col items-stretch">
          <ItemContent className="gap-3">
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">Net Royalties</Text>
              <Text className="text-sm font-medium tabular-nums">${formatCurrency(netRoyalties)}</Text>
            </View>
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">Processing Fee</Text>
              <Text className="text-sm font-medium tabular-nums">-${formatCurrency(processingFee)}</Text>
            </View>
            <Separator />
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">Total Ready to Claim</Text>
              <Text className="text-sm font-semibold tabular-nums">${formatCurrency(totalClaimable)} USD</Text>
            </View>
          </ItemContent>
        </Item>
      </CardContent>
      <CardFooter>
        <CardDescription>
          Once your bank is connected, balances over $10.00 are automatically eligible for monthly distribution on the
          15th of each month.
        </CardDescription>
      </CardFooter>
    </Card>
  )
}
