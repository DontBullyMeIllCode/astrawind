import * as React from "react"
import { Pressable } from "react-native"
import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Icon } from "@astrawind/ui/icon"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@astrawind/ui/item"

export default function ItemExample() {
  return (
    <View className="flex w-full max-w-md flex-col gap-6">
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Basic Item</ItemTitle>
          <ItemDescription>A simple item with title and description.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Action
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline" size="sm" asChild>
        <Pressable onPress={() => {}}>
          <ItemMedia>
            <Icon as={BadgeCheckIcon} className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Your profile has been verified.</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Icon as={ChevronRightIcon} className="size-4" />
          </ItemActions>
        </Pressable>
      </Item>
      <ItemGroup>
        <Item variant="muted" onPress={() => {}}>
          <ItemMedia variant="icon">
            <Icon as={BadgeCheckIcon} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Pressable item</ItemTitle>
            <ItemDescription>With an icon and a description.</ItemDescription>
          </ItemContent>
          <ItemContent>
            <ItemDescription>Second content</ItemDescription>
          </ItemContent>
        </Item>
        <ItemSeparator />
        <Item>
          <ItemHeader>Header</ItemHeader>
          <ItemContent>
            <ItemTitle>With header and footer</ItemTitle>
          </ItemContent>
          <ItemFooter>Footer</ItemFooter>
        </Item>
      </ItemGroup>
    </View>
  )
}
