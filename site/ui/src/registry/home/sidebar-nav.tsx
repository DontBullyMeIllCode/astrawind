import * as React from "react"
import { useWindowDimensions } from "react-native"
import {
  ActivityIcon,
  ArrowLeftRightIcon,
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartColumnIcon,
  ChartLineIcon,
  ChartPieIcon,
  CircleHelpIcon,
  CreditCardIcon,
  FileTextIcon,
  GlobeIcon,
  LandmarkIcon,
  MessageSquareIcon,
  PaletteIcon,
  ShieldIcon,
  TargetIcon,
  TrendingUpIcon,
  UserIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react-native"
import { View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Card } from "@astrawind/ui/card"
import { Icon } from "@astrawind/ui/icon"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@astrawind/ui/sidebar"

// `rounded-3xl` (the newer styles' card radius) is left out, to match the other cards.
function SidebarSection({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("w-full overflow-hidden py-0", className)}>
      <SidebarProvider className="min-h-0">
        <Sidebar collapsible="none" className="w-full bg-transparent">
          <SidebarContent className="gap-0 overflow-hidden">
            <SidebarGroup>
              <SidebarGroupLabel>{label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">{children}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Card>
  )
}

function MenuLink({ icon, label, isActive }: { icon: LucideIcon; label: string; isActive?: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive}>
        <Icon as={icon} />
        {label}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function SidebarNav() {
  const overview = (
    <SidebarSection key="overview" label="Overview">
      <MenuLink icon={ChartLineIcon} label="Analytics" isActive />
      <MenuLink icon={ArrowLeftRightIcon} label="Transactions" />
      <MenuLink icon={TrendingUpIcon} label="Investments" />
      <MenuLink icon={LandmarkIcon} label="Accounts" />
      <MenuLink icon={ChartPieIcon} label="Spending" />
    </SidebarSection>
  )
  const planning = (
    <SidebarSection key="planning" label="Planning">
      <MenuLink icon={FileTextIcon} label="Documents" />
      <MenuLink icon={WalletIcon} label="Budget" />
      <MenuLink icon={ChartColumnIcon} label="Reports" />
      <MenuLink icon={TargetIcon} label="Goals" />
      <MenuLink icon={CalendarIcon} label="Calendar" />
    </SidebarSection>
  )
  const support = (
    <SidebarSection key="support" label="Support" className="flex">
      <MenuLink icon={CircleHelpIcon} label="Help Center" />
      <MenuLink icon={BookOpenIcon} label="Docs" />
      <MenuLink icon={MessageSquareIcon} label="Contact Us" />
      <MenuLink icon={ActivityIcon} label="Status" />
      <MenuLink icon={GlobeIcon} label="Community" />
    </SidebarSection>
  )
  const account = (
    <SidebarSection key="account" label="Account" className="flex">
      <MenuLink icon={UserIcon} label="Profile" />
      <MenuLink icon={CreditCardIcon} label="Billing" isActive />
      <MenuLink icon={BellIcon} label="Notifications" />
      <MenuLink icon={ShieldIcon} label="Security" />
      <MenuLink icon={PaletteIcon} label="Appearance" />
    </SidebarSection>
  )

  // `xl:col-start-* xl:row-start-*`: grid placement isn't emulated, so on xl the sections are
  // written in the order they're placed in (Planning, Support / Overview, Account).
  const xl = useWindowDimensions().width >= 1280
  return (
    <View className="grid w-full grid-cols-2 gap-4 xl:gap-6">
      {xl ? [planning, support, overview, account] : [overview, planning, support, account]}
    </View>
  )
}
