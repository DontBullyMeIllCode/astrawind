import { XIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Field, FieldGroup, FieldLabel } from "@astrawind/ui/field"
import { Icon } from "@astrawind/ui/icon"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@astrawind/ui/input-group"
import { Item, ItemContent } from "@astrawind/ui/item"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@astrawind/ui/select"
import { Separator } from "@astrawind/ui/separator"

const FROM_ACCOUNTS = [
  { label: "Main Checking (··8402) — $12,450.00", value: "checking" },
  { label: "Business (··7731) — $8,920.00", value: "business" },
]

const TO_ACCOUNTS = [
  { label: "High Yield Savings (··1192) — $42,100.00", value: "savings" },
  { label: "Investment (··3349) — $18,200.00", value: "investment" },
]

export function TransferFunds() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Funds</CardTitle>
        <CardDescription>Move money between your connected accounts.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" className="bg-muted" aria-label="Dismiss transfer funds">
            <Icon as={XIcon} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel nativeID="transfer-amount">Amount to Transfer</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput aria-labelledby="transfer-amount" defaultValue="1,200.00" />
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel nativeID="from-account">From Account</FieldLabel>
            <Select defaultValue="checking">
              <SelectTrigger aria-labelledby="from-account" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FROM_ACCOUNTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel nativeID="to-account">To Account</FieldLabel>
            <Select defaultValue="savings">
              <SelectTrigger aria-labelledby="to-account" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TO_ACCOUNTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Item variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-3">
              <View className="flex items-center justify-between">
                <Text className="text-sm text-muted-foreground">Estimated arrival</Text>
                <Text className="text-sm font-medium">Today, Apr 14</Text>
              </View>
              <Separator />
              <View className="flex items-center justify-between">
                <Text className="text-sm text-muted-foreground">Transaction fee</Text>
                <Text className="text-sm font-medium tabular-nums">$0.00</Text>
              </View>
              <Separator />
              <View className="flex items-center justify-between">
                <Text className="text-sm font-medium">Total amount</Text>
                <Text className="text-sm font-semibold tabular-nums">$1,200.00</Text>
              </View>
            </ItemContent>
          </Item>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Confirm Transfer</Button>
      </CardFooter>
    </Card>
  )
}
