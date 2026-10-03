import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Field, FieldGroup, FieldLabel } from "@astrawind/ui/field"
import { Input } from "@astrawind/ui/input"

export function NewMilestone() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new milestone</CardTitle>
        <CardDescription>Define your financial target and we&apos;ll help you pace your savings.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel nativeID="goal-name">Goal Name</FieldLabel>
            <Input aria-labelledby="goal-name" placeholder="e.g. New Car, Home Downpayment" />
          </Field>
          <View className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel nativeID="target-amount">Target Amount</FieldLabel>
              <Input aria-labelledby="target-amount" defaultValue="$15,000" />
            </Field>
            <Field>
              <FieldLabel nativeID="target-date">Target Date</FieldLabel>
              <Input aria-labelledby="target-date" defaultValue="Dec 2025" />
            </Field>
          </View>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full">Create Goal</Button>
        <Button variant="outline" className="w-full">
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
