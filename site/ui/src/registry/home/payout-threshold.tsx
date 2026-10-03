import { XIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@astrawind/ui/field"
import { Icon } from "@astrawind/ui/icon"
import { Progress } from "@astrawind/ui/progress"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@astrawind/ui/select"
import { Textarea } from "@astrawind/ui/textarea"

const CURRENCIES = [
  { label: "USD — United States Dollar", value: "usd" },
  { label: "EUR — Euro", value: "eur" },
  { label: "GBP — British Pound", value: "gbp" },
  { label: "JPY — Japanese Yen", value: "jpy" },
]

export function PayoutThreshold() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Threshold</CardTitle>
        <CardDescription>Set the minimum balance required before a payout is triggered.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" className="bg-muted" aria-label="Dismiss payout threshold">
            <Icon as={XIcon} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel nativeID="preferred-currency">Preferred Currency</FieldLabel>
            <Select defaultValue="usd">
              <SelectTrigger aria-labelledby="preferred-currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CURRENCIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <View className="flex items-baseline justify-between">
              <FieldLabel nativeID="min-payout-label">Minimum Payout Amount</FieldLabel>
              <Text className="text-2xl font-semibold tabular-nums">$2500.00</Text>
            </View>
            <Progress value={25} aria-labelledby="min-payout-label" aria-valuetext="$2,500 of $10,000" />
            <View className="flex items-center justify-between">
              <FieldDescription>$50 (MIN)</FieldDescription>
              <FieldDescription>$10,000 (MAX)</FieldDescription>
            </View>
          </Field>
          <Field>
            <FieldLabel nativeID="payout-notes">Notes</FieldLabel>
            <Textarea
              aria-labelledby="payout-notes"
              placeholder="Add any notes for this payout configuration..."
              className="min-h-[100px]"
            />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Save Threshold</Button>
      </CardFooter>
    </Card>
  )
}
