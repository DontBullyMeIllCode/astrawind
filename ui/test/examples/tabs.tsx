import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Input } from "@astrawind/ui/input"
import { Label } from "@astrawind/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@astrawind/ui/tabs"

export default function TabsExample() {
  const [value, setValue] = React.useState("overview")
  return (
    <View className="flex w-full max-w-sm flex-col gap-6">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="disabled" disabled>
            Disabled
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Make changes to your account here. Click save when you&apos;re done.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <View className="grid gap-3">
                <Label htmlFor="tabs-demo-name">Name</Label>
                <Input nativeID="tabs-demo-name" defaultValue="Pedro Duarte" />
              </View>
              <View className="grid gap-3">
                <Label htmlFor="tabs-demo-username">Username</Label>
                <Input nativeID="tabs-demo-username" defaultValue="@peduarte" />
              </View>
            </CardContent>
            <CardFooter>
              <Button>Save changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password here. After saving, you&apos;ll be logged out.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <View className="grid gap-3">
                <Label htmlFor="tabs-demo-current">Current password</Label>
                <Input nativeID="tabs-demo-current" secureTextEntry />
              </View>
              <View className="grid gap-3">
                <Label htmlFor="tabs-demo-new">New password</Label>
                <Input nativeID="tabs-demo-new" secureTextEntry />
              </View>
            </CardContent>
            <CardFooter>
              <Button>Save password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <Tabs value={value} onValueChange={setValue}>
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs defaultValue="general" orientation="vertical">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="general">General settings</TabsContent>
      </Tabs>
    </View>
  )
}
