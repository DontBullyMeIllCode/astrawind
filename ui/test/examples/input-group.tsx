import * as React from "react"
import { ArrowUpIcon, CheckIcon, InfoIcon, PlusIcon, SearchIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Icon } from "@astrawind/ui/icon"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@astrawind/ui/input-group"
import { Separator } from "@astrawind/ui/separator"

export default function InputGroupExample() {
  return (
    <View className="w-full max-w-sm gap-6">
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <Icon as={SearchIcon} />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="example.com" className="!pl-1" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton className="rounded-full" size="icon-xs" aria-label="Info">
            <Icon as={InfoIcon} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea placeholder="Ask, Search or Chat..." />
        <InputGroupAddon align="block-end">
          <InputGroupButton variant="outline" className="rounded-full" size="icon-xs" aria-label="Add">
            <Icon as={PlusIcon} />
          </InputGroupButton>
          <InputGroupButton variant="ghost">Auto</InputGroupButton>
          <InputGroupText className="ml-auto">52% used</InputGroupText>
          <Separator orientation="vertical" className="!h-4" />
          <InputGroupButton variant="default" className="rounded-full" size="icon-xs" disabled>
            <Icon as={ArrowUpIcon} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="@shadcn" aria-invalid />
        <InputGroupAddon align="inline-end">
          <View className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon as={CheckIcon} className="size-3" />
          </View>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon align="block-start" className="border-b">
          <InputGroupText className="font-mono font-medium">script.js</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="console.log()" />
      </InputGroup>
    </View>
  )
}
