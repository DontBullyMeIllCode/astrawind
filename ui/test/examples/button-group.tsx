import * as React from "react"
import { ArrowLeftIcon, MinusIcon, PlusIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@astrawind/ui/button-group"
import { Icon } from "@astrawind/ui/icon"
import { Input } from "@astrawind/ui/input"

export default function ButtonGroupExample() {
  return (
    <View className="flex flex-col items-start gap-4">
      <ButtonGroup>
        <ButtonGroup className="hidden sm:flex">
          <Button variant="outline" size="icon" aria-label="Go Back">
            <Icon as={ArrowLeftIcon} />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">Archive</Button>
          <Button variant="outline">Report</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">Snooze</Button>
        </ButtonGroup>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" aria-label="Media controls" className="h-fit">
        <Button variant="outline" size="icon">
          <Icon as={PlusIcon} />
        </Button>
        <Button variant="outline" size="icon">
          <Icon as={MinusIcon} />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="secondary" size="sm">
          Copy
        </Button>
        <ButtonGroupSeparator />
        <Button variant="secondary" size="sm">
          Paste
        </Button>
      </ButtonGroup>
      <ButtonGroup className="w-full">
        <ButtonGroupText>https://</ButtonGroupText>
        <Input placeholder="example.com" />
        <Button variant="outline">Go</Button>
      </ButtonGroup>
    </View>
  )
}
