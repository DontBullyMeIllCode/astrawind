import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@astrawind/ui/dialog"
import { Input } from "@astrawind/ui/input"
import { Label } from "@astrawind/ui/label"

export default function DialogExample() {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Make changes to your profile here. Click save when you&apos;re done.</DialogDescription>
          </DialogHeader>
          <View className="grid gap-4">
            <View className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input nativeID="name-1" defaultValue="Pedro Duarte" />
            </View>
            <View className="grid gap-3">
              <Label htmlFor="username-1">Username</Label>
              <Input nativeID="username-1" defaultValue="@peduarte" />
            </View>
          </View>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">No Close Button</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No Close Button</DialogTitle>
            <DialogDescription>This dialog doesn&apos;t have a close button in the top-right corner.</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </View>
  )
}
