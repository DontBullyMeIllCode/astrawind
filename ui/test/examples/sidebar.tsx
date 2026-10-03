import * as React from "react"
import {
  CalendarIcon,
  ChevronRightIcon,
  GalleryVerticalEndIcon,
  HomeIcon,
  InboxIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  User2Icon,
} from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@astrawind/ui/collapsible"
import { Icon } from "@astrawind/ui/icon"
import { Separator } from "@astrawind/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@astrawind/ui/sidebar"

const ITEMS = [
  { title: "Home", icon: HomeIcon, badge: undefined },
  { title: "Inbox", icon: InboxIcon, badge: "24" },
  { title: "Calendar", icon: CalendarIcon, badge: undefined },
  { title: "Search", icon: SearchIcon, badge: undefined },
]

const SETTINGS = ["General", "Team", "Billing", "Limits"]

export default function SidebarExample() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <View className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Icon as={GalleryVerticalEndIcon} className="size-4" />
                </View>
                <View className="flex flex-col gap-0.5 leading-none">
                  <Text className="font-medium">Documentation</Text>
                  <Text className="text-xs">v1.0.0</Text>
                </View>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarInput placeholder="Search the docs..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupAction aria-label="Add Project">
              <Icon as={PlusIcon} />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {ITEMS.map((item, i) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={i === 0} tooltip={item.title}>
                      <Icon as={item.icon} />
                      <Text>{item.title}</Text>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : (
                      <SidebarMenuAction showOnHover aria-label="More">
                        <Icon as={MoreHorizontalIcon} />
                      </SidebarMenuAction>
                    )}
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <Collapsible defaultOpen className="group/collapsible">
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Settings">
                        <Icon as={SettingsIcon} />
                        <Text>Settings</Text>
                        <Icon
                          as={ChevronRightIcon}
                          className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {SETTINGS.map((title, i) => (
                          <SidebarMenuSubItem key={title}>
                            <SidebarMenuSubButton isActive={i === 0} size={i === 3 ? "sm" : "md"}>
                              {title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Loading</SidebarGroupLabel>
            <SidebarMenu>
              {[0, 1, 2].map((i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton variant="outline" size="sm">
                <Icon as={User2Icon} />
                Username
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <View className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Text className="text-sm font-medium">Dashboard</Text>
        </View>
        <View className="flex flex-1 flex-col gap-4 p-4">
          <View className="aspect-video rounded-xl bg-muted/50" />
          <View className="min-h-40 flex-1 rounded-xl bg-muted/50" />
        </View>
      </SidebarInset>
    </SidebarProvider>
  )
}
