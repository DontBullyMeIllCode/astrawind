import * as React from "react"
import { Text } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"
import { Button } from "@astrawind/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Input } from "@astrawind/ui/input"
import { Label } from "@astrawind/ui/label"
import { Separator } from "@astrawind/ui/separator"
import { Skeleton } from "@astrawind/ui/skeleton"

export default function CardExample() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
        <CardAction>
          <Button variant="link">Sign Up</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="gap-2">
        <Label htmlFor="email">Email</Label>
        <Input nativeID="email" placeholder="m@example.com" keyboardType="email-address" />
        <Separator />
        <Skeleton className="h-4 w-[250px]" />
        <Badge variant="secondary">Badge</Badge>
      </CardContent>
      <CardFooter className="flex-col gap-2 border-t">
        <Button className="w-full">Login</Button>
        <Text className="text-sm">Plain text</Text>
      </CardFooter>
    </Card>
  )
}
