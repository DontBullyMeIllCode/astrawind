import * as React from "react"
import { View } from "@astrawind/css"
import { Bubble, BubbleContent } from "@astrawind/ui/bubble"
import { Message, MessageContent } from "@astrawind/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@astrawind/ui/message-scroller"

const MESSAGES = Array.from({ length: 12 }, (_, i) => ({
  id: `m${i}`,
  role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
  text:
    i % 2 === 0
      ? `Question ${i / 2 + 1}: how does the scroller keep up with new messages?`
      : "It stays pinned to the bottom while you're there, and shows a button to jump back once you scroll up.",
}))

export default function MessageScrollerExample() {
  return (
    <View className="h-96 w-full max-w-md rounded-xl border">
      <MessageScrollerProvider autoScroll>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-4">
              {MESSAGES.map((m) => (
                <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>
                  <Message align={m.role === "user" ? "end" : "start"}>
                    <MessageContent>
                      <Bubble variant={m.role === "user" ? "default" : "ghost"}>
                        <BubbleContent>{m.text}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </View>
  )
}
