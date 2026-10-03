import * as React from "react"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Icon } from "@astrawind/ui/icon"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@astrawind/ui/navigation-menu"

const components: { title: string; description: string }[] = [
  {
    title: "Alert Dialog",
    description: "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    description: "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    description: "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Tabs",
    description: "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
]

function ListItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <NavigationMenuLink>
      <Text className="text-sm leading-none font-medium">{title}</Text>
      <Text numberOfLines={2} className="text-sm leading-snug text-muted-foreground">
        {children}
      </Text>
    </NavigationMenuLink>
  )
}

export default function NavigationMenuExample() {
  return (
    <View className="gap-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Home</NavigationMenuTrigger>
            <NavigationMenuContent>
              <View className="w-[300px] gap-2">
                <NavigationMenuLink className="rounded-md bg-muted p-6">
                  <Text className="mb-2 text-lg font-medium">shadcn/ui</Text>
                  <Text className="text-sm leading-tight text-muted-foreground">
                    Beautifully designed components built with Tailwind CSS.
                  </Text>
                </NavigationMenuLink>
                <ListItem title="Introduction">Re-usable components built using Radix UI and Tailwind CSS.</ListItem>
                <ListItem title="Installation">How to install dependencies and structure your app.</ListItem>
              </View>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="components">
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent>
              <View className="w-[300px] gap-2">
                {components.map((component) => (
                  <ListItem key={component.title} title={component.title}>
                    {component.description}
                  </ListItem>
                ))}
              </View>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()} active>
              <Text>Docs</Text>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuIndicator />
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenu>

      <NavigationMenu viewport={false} defaultValue="">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
            <NavigationMenuContent>
              <View className="w-[200px] gap-4">
                <NavigationMenuLink className="flex-row items-center gap-2">
                  <Icon as={CircleHelpIcon} />
                  Backlog
                </NavigationMenuLink>
                <NavigationMenuLink className="flex-row items-center gap-2">
                  <Icon as={CircleIcon} />
                  To Do
                </NavigationMenuLink>
                <NavigationMenuLink className="flex-row items-center gap-2">
                  <Icon as={CircleCheckIcon} />
                  Done
                </NavigationMenuLink>
              </View>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </View>
  )
}
