import * as React from "react"
import { CircleCheckIcon, CircleXIcon, InfoIcon, TriangleAlertIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Alert, AlertTitle } from "@astrawind/ui/alert"
import { Icon } from "@astrawind/ui/icon"

export default function AlertDashExample() {
  return (
    <View className="w-full max-w-xl gap-4">
      <Alert variant="dash" color="info">
        <Icon as={InfoIcon} />
        <AlertTitle>New software update available.</AlertTitle>
      </Alert>
      <Alert variant="dash" color="success">
        <Icon as={CircleCheckIcon} />
        <AlertTitle>Your purchase has been confirmed!</AlertTitle>
      </Alert>
      <Alert variant="dash" color="warning">
        <Icon as={TriangleAlertIcon} />
        <AlertTitle>Warning: Invalid email address!</AlertTitle>
      </Alert>
      <Alert variant="dash" color="error">
        <Icon as={CircleXIcon} />
        <AlertTitle>Error! Task failed successfully.</AlertTitle>
      </Alert>
    </View>
  )
}
