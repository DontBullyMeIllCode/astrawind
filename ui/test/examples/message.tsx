import * as React from "react"
import { CheckCheckIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Bubble, BubbleContent } from "@astrawind/ui/bubble"
import { Icon } from "@astrawind/ui/icon"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@astrawind/ui/message"

export default function MessageExample() {
  return (
    <View className="w-full max-w-md gap-6">
      <MessageGroup>
        <Message>
          <MessageAvatar className="size-8">
            <Text className="text-xs font-medium">OL</Text>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Olivia</MessageHeader>
            <Bubble variant="secondary">
              <BubbleContent>Hey! Did you get a chance to look at the new designs?</BubbleContent>
            </Bubble>
            <Bubble variant="secondary">
              <BubbleContent>No rush, whenever you have time.</BubbleContent>
            </Bubble>
            <MessageFooter>9:41 AM</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>Yes, they look great. Shipping them today.</BubbleContent>
          </Bubble>
          <MessageFooter className="gap-1">
            Read
            <Icon as={CheckCheckIcon} className="size-3.5" />
          </MessageFooter>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar className="size-8">
          <Text className="text-xs font-medium">AI</Text>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Assistant</MessageHeader>
          <Bubble variant="ghost">
            <BubbleContent>
              A ghost bubble has no background or padding, for longer answers that read like a document.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </View>
  )
}
