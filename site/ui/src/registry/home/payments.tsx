import { CalendarIcon, ChevronRightIcon, CircleEllipsisIcon, RefreshCwIcon, SettingsIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@astrawind/ui/breadcrumb"
import { Button } from "@astrawind/ui/button"
import { Card, CardContent, CardHeader } from "@astrawind/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@astrawind/ui/dropdown-menu"
import { Icon } from "@astrawind/ui/icon"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@astrawind/ui/item"

const LINKS = [
  {
    icon: SettingsIcon,
    title: "Change transfer limit",
    description: "Adjust how much you can send from your balance.",
  },
  {
    icon: CalendarIcon,
    title: "Scheduled transfers",
    description: "Set up a transfer to send at a later date.",
  },
  {
    icon: RefreshCwIcon,
    title: "Recurring card payments",
    description: "Manage your repeated card transactions.",
  },
]

export function Payments() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label="Account options">
                    <Icon as={CircleEllipsisIcon} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Statements</DropdownMenuItem>
                    <DropdownMenuItem>Documents</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Payments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CardHeader>
      <CardContent>
        {/* `gap-4`: the newer styles space the items of an ItemGroup; new-york's has no gap. */}
        <ItemGroup className="gap-4">
          {LINKS.map((link) => (
            <View key={link.title} role="listitem" className="w-full">
              <Item variant="muted" role="link" onPress={() => {}}>
                <ItemMedia variant="icon">
                  <Icon as={link.icon} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{link.title}</ItemTitle>
                  <ItemDescription>{link.description}</ItemDescription>
                </ItemContent>
                <Icon as={ChevronRightIcon} className="size-4 shrink-0 text-muted-foreground" />
              </Item>
            </View>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
