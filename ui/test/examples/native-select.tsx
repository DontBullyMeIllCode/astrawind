import * as React from "react"
import { View } from "@astrawind/css"
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@astrawind/ui/native-select"

export default function NativeSelectExample() {
  const [status, setStatus] = React.useState("")
  return (
    <View className="gap-4">
      <NativeSelect value={status} onValueChange={setStatus}>
        <NativeSelectOption value="">Select status</NativeSelectOption>
        <NativeSelectOption value="todo">Todo</NativeSelectOption>
        <NativeSelectOption value="in-progress">In Progress</NativeSelectOption>
        <NativeSelectOption value="done">Done</NativeSelectOption>
        <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
      </NativeSelect>
      <NativeSelect defaultValue="engineering">
        <NativeSelectOption value="">Select department</NativeSelectOption>
        <NativeSelectOptGroup label="Engineering">
          <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
          <NativeSelectOption value="backend">Backend</NativeSelectOption>
          <NativeSelectOption value="devops">DevOps</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Sales">
          <NativeSelectOption value="sales-rep">Sales Rep</NativeSelectOption>
          <NativeSelectOption value="account-manager">Account Manager</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
      <NativeSelect size="sm" disabled>
        <NativeSelectOption value="">Disabled</NativeSelectOption>
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
      </NativeSelect>
      <NativeSelect aria-invalid>
        <NativeSelectOption value="">Error state</NativeSelectOption>
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
        <NativeSelectOption value="banana" disabled>
          Banana
        </NativeSelectOption>
      </NativeSelect>
    </View>
  )
}
