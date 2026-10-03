import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@astrawind/ui/field"
import { Input } from "@astrawind/ui/input"
import { Textarea } from "@astrawind/ui/textarea"

export default function FieldExample() {
  return (
    <View className="w-full max-w-md">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Payment Method</FieldLegend>
          <FieldDescription>All transactions are secure and encrypted</FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="checkout-card-name">Name on Card</FieldLabel>
              <Input nativeID="checkout-card-name" placeholder="Evil Rabbit" />
            </Field>
            <Field data-invalid="true">
              <FieldLabel htmlFor="checkout-card-number">Card Number</FieldLabel>
              <Input nativeID="checkout-card-number" placeholder="1234 5678 9012 3456" aria-invalid />
              <FieldDescription>Enter your 16-digit card number</FieldDescription>
              <FieldError errors={[{ message: "Card number is required." }]} />
            </Field>
            <View className="flex-row gap-4">
              <Field className="flex-1">
                <FieldLabel htmlFor="checkout-cvv">CVV</FieldLabel>
                <Input nativeID="checkout-cvv" placeholder="123" />
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="checkout-exp">Expires</FieldLabel>
                <Input nativeID="checkout-exp" placeholder="MM/YY" />
              </Field>
            </View>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend variant="label">Billing Address</FieldLegend>
          <FieldDescription>The billing address associated with your payment method</FieldDescription>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Same as shipping address</FieldTitle>
              <FieldDescription>Use the address you entered above.</FieldDescription>
            </FieldContent>
            <Button variant="outline" size="sm">
              Use
            </Button>
          </Field>
        </FieldSet>
        <FieldSeparator>Or</FieldSeparator>
        <FieldSet>
          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="checkout-comments">Comments</FieldLabel>
              <Textarea nativeID="checkout-comments" placeholder="Add any additional comments" className="resize-none" />
            </Field>
            <FieldError errors={[{ message: "Too short." }, { message: "Must mention a rabbit." }, { message: "Too short." }]} />
          </FieldGroup>
        </FieldSet>
        <Field orientation="horizontal">
          <Button>Submit</Button>
          <Button variant="outline">Cancel</Button>
        </Field>
      </FieldGroup>
    </View>
  )
}
