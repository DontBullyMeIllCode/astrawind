import * as React from "react"
import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Alert, AlertDescription, AlertTitle } from "@astrawind/ui/alert"
import { Icon } from "@astrawind/ui/icon"

export default function AlertExample() {
  return (
    <View className="w-full max-w-xl gap-4">
      <Alert>
        <Icon as={CheckCircle2Icon} />
        <AlertTitle>Success! Your changes have been saved</AlertTitle>
        <AlertDescription>This is an alert with icon, title and description.</AlertDescription>
      </Alert>
      <Alert>
        <Icon as={PopcornIcon} />
        <AlertTitle>This Alert has a title and an icon. No description.</AlertTitle>
      </Alert>
      <Alert variant="destructive">
        <Icon as={AlertCircleIcon} />
        <AlertTitle>Unable to process your payment.</AlertTitle>
        <AlertDescription>
          <Text>Please verify your billing information and try again.</Text>
          <View className="gap-1 pl-2">
            <Text>• Check your card details</Text>
            <Text>• Ensure sufficient funds</Text>
            <Text>• Verify billing address</Text>
          </View>
        </AlertDescription>
      </Alert>
      <Alert>
        <AlertTitle>No icon</AlertTitle>
        <AlertDescription>An alert without an icon.</AlertDescription>
      </Alert>
    </View>
  )
}
