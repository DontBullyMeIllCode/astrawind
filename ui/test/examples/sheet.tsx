import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Input } from "@astrawind/ui/input"
import { Label } from "@astrawind/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@astrawind/ui/sheet"

const SIDES = ["top", "right", "bottom", "left"] as const

export default function SheetExample() {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
          </SheetHeader>
          <View className="grid flex-1 auto-rows-min gap-6 px-4">
            <View className="grid gap-3">
              <Label htmlFor="sheet-demo-name">Name</Label>
              <Input nativeID="sheet-demo-name" defaultValue="Pedro Duarte" />
            </View>
            <View className="grid gap-3">
              <Label htmlFor="sheet-demo-username">Username</Label>
              <Input nativeID="sheet-demo-username" defaultValue="@peduarte" />
            </View>
          </View>
          <SheetFooter>
            <Button>Save changes</Button>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {SIDES.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline">{side}</Button>
          </SheetTrigger>
          <SheetContent side={side} showCloseButton={side !== "bottom"}>
            <SheetHeader>
              <SheetTitle>Side: {side}</SheetTitle>
              <SheetDescription>This sheet slides in from the {side}.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
    </View>
  )
}
