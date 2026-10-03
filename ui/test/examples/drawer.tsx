import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@astrawind/ui/drawer"
import { Icon } from "@astrawind/ui/icon"

export default function DrawerExample() {
  const [goal, setGoal] = React.useState(350)
  const onClick = (adjustment: number) => setGoal(Math.max(200, Math.min(400, goal + adjustment)))

  return (
    <View className="flex-row flex-wrap gap-2">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Open Drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <View className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Move Goal</DrawerTitle>
              <DrawerDescription>Set your daily activity goal.</DrawerDescription>
            </DrawerHeader>
            <View className="p-4 pb-0">
              <View className="flex-row items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0 rounded-full"
                  onPress={() => onClick(-10)}
                  disabled={goal <= 200}
                  aria-label="Decrease"
                >
                  <Icon as={MinusIcon} />
                </Button>
                <View className="flex-1 items-center">
                  <Text className="text-7xl font-bold tracking-tighter">{goal}</Text>
                  <Text className="text-[0.70rem] text-muted-foreground uppercase">Calories/day</Text>
                </View>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0 rounded-full"
                  onPress={() => onClick(10)}
                  disabled={goal >= 400}
                  aria-label="Increase"
                >
                  <Icon as={PlusIcon} />
                </Button>
              </View>
            </View>
            <DrawerFooter>
              <Button>Submit</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </View>
        </DrawerContent>
      </Drawer>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button variant="outline">Right</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Right drawer</DrawerTitle>
            <DrawerDescription>Swipe right to close.</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </View>
  )
}
