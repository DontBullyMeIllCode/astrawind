import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Label } from "@astrawind/ui/label"
import { Textarea } from "@astrawind/ui/textarea"

export default function TextareaExample() {
  return (
    <View className="w-full gap-6">
      <Textarea placeholder="Type your message here." />
      <Textarea placeholder="Type your message here." editable={false} />
      <View className="w-full gap-3">
        <Label htmlFor="message">Your message</Label>
        <Textarea nativeID="message" placeholder="Type your message here." />
        <Text className="text-sm text-muted-foreground">Your message will be copied to the support team.</Text>
      </View>
      <View className="w-full gap-2">
        <Textarea placeholder="Type your message here." aria-invalid />
        <Button>Send message</Button>
      </View>
    </View>
  )
}
