import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@astrawind/ui/accordion"

export default function AccordionExample() {
  const [value, setValue] = React.useState<string[]>(["item-2"])
  return (
    <View className="flex flex-col gap-6">
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Product Information</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <Text>
              Our flagship product combines cutting-edge technology with sleek design. Built with premium materials, it
              offers unparalleled performance and reliability.
            </Text>
            <Text>
              Key features include advanced processing capabilities, and an intuitive user interface designed for both
              beginners and experts.
            </Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Shipping Details</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            We offer worldwide shipping through trusted courier partners. Standard delivery takes 3-5 business days.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Return Policy</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            We stand behind our products with a comprehensive 30-day return policy.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion type="multiple" value={value} onValueChange={setValue}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>Yes. It comes with default styles that match the other components.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" disabled>
          <AccordionTrigger>Is it disabled?</AccordionTrigger>
          <AccordionContent>Yes.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </View>
  )
}
