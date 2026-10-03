import * as React from "react"
import { PlusIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Icon } from "@astrawind/ui/icon"

export default function CardDashExample() {
  return (
    <View className="w-full max-w-sm gap-4">
      <Card variant="dash">
        <CardHeader>
          <CardTitle>Create a project</CardTitle>
          <CardDescription>Projects group your deployments, domains and environment variables.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="dash">
            <Icon as={PlusIcon} />
            New project
          </Button>
        </CardContent>
      </Card>
    </View>
  )
}
