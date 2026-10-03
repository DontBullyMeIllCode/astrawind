import * as React from "react"
import type { LayoutChangeEvent } from "react-native"
import { CreditCardIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react-native"
import { ScrollView, Text, View } from "@astrawind/css"
import { cn, ThemeProvider } from "@astrawind/ui"
import { Icon } from "@astrawind/ui/icon"
import AccordionExample from "@examples/accordion"
import AlertExample from "@examples/alert"
import AlertSoftExample from "@examples/alert.soft"
import AvatarExample from "@examples/avatar"
import BadgeExample from "@examples/badge"
import BadgeDashExample from "@examples/badge.dash"
import BadgeSoftExample from "@examples/badge.soft"
import ButtonExample from "@examples/button"
import ButtonColorsExample from "@examples/button.colors"
import ButtonSoftExample from "@examples/button.soft"
import CalendarExample from "@examples/calendar"
import CardExample from "@examples/card"
import CardDashExample from "@examples/card.dash"
import CheckboxExample from "@examples/checkbox"
import FieldExample from "@examples/field"
import InputExample from "@examples/input"
import InputOTPExample from "@examples/input-otp"
import PaginationExample from "@examples/pagination"
import ProgressExample from "@examples/progress"
import RadioGroupExample from "@examples/radio-group"
import SelectExample from "@examples/select"
import SliderExample from "@examples/slider"
import SwitchExample from "@examples/switch"
import TableExample from "@examples/table"
import TabsExample from "@examples/tabs"
import ToggleGroupExample from "@examples/toggle-group"
import { ChartAreaStacked } from "@/registry/charts/chart-area-stacked"
import { ChartLineMultiple } from "@/registry/charts/chart-line-multiple"
import { AccountAccess } from "@/registry/home/account-access"
import { AnalyticsCard } from "@/registry/home/analytics-card"
import { ClaimableBalance } from "@/registry/home/claimable-balance"
import { ContributionHistory } from "@/registry/home/contribution-history"
import { DividendIncome } from "@/registry/home/dividend-income"
import { EmptyDistributeTrack } from "@/registry/home/empty-distribute-track"
import { NewMilestone } from "@/registry/home/new-milestone"
import { NotificationSettings } from "@/registry/home/notification-settings"
import { DEFAULT_OPTIONS, themeProps, type CreateOptions, type Mode } from "@/lib/create"

/** The status colors in the components' styles (not in shadcn's Create): solid and soft buttons. */
function StatusButtons() {
  return (
    <View className="w-full gap-3">
      <ButtonColorsExample />
      <ButtonSoftExample />
    </View>
  )
}

/** Soft and dashed badges. */
function StatusBadges() {
  return (
    <View className="w-full gap-3">
      <BadgeSoftExample />
      <BadgeDashExample />
    </View>
  )
}

/**
 * A menu drawn in place with DropdownMenuContent's classes. Real menus render
 * into the site's portal host (outside the preview's theme), so this is what
 * shows the Menu and Menu Accent options.
 */
export function MenuPreview({ className }: { className?: string }) {
  const items = [
    { icon: UserIcon, label: "Profile", shortcut: "⇧⌘P" },
    { icon: CreditCardIcon, label: "Billing", shortcut: "⌘B", highlighted: true },
    { icon: SettingsIcon, label: "Settings", shortcut: "⌘S" },
  ]
  return (
    <View
      role="menu"
      className={cn("w-56 self-center rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}
    >
      <Text className="px-2 py-1.5 text-sm font-medium">My Account</Text>
      {items.map((item) => (
        <View
          key={item.label}
          role="menuitem"
          className={cn(
            "flex-row items-center gap-2 rounded-sm px-2 py-1.5",
            item.highlighted && "bg-accent text-accent-foreground"
          )}
        >
          <Icon as={item.icon} className={cn("size-4", !item.highlighted && "text-muted-foreground")} />
          <Text className="flex-1 text-sm">{item.label}</Text>
          <Text className={cn("text-xs tracking-widest", item.highlighted ? "opacity-70" : "text-muted-foreground")}>
            {item.shortcut}
          </Text>
        </View>
      ))}
      <View className="-mx-1 my-1 h-px bg-border" />
      <View role="menuitem" className="flex-row items-center gap-2 rounded-sm px-2 py-1.5">
        <Icon as={LogOutIcon} className="size-4 text-muted-foreground" />
        <Text className="flex-1 text-sm">Log out</Text>
      </View>
    </View>
  )
}

type Item = {
  key: string
  Component: React.ComponentType
  /** Draw a card-like frame around it (examples that aren't cards themselves). */
  framed?: boolean
  /** A rough height, for balancing the columns. */
  weight: number
}

const ITEMS: Item[] = [
  { key: "analytics", Component: AnalyticsCard, weight: 3 },
  { key: "button", Component: ButtonExample, framed: true, weight: 1.5 },
  // Status colors, soft and dash (beyond shadcn), next to their shadcn counterparts.
  { key: "status-buttons", Component: StatusButtons, framed: true, weight: 2.5 },
  { key: "card", Component: CardExample, weight: 4 },
  { key: "menu", Component: MenuPreview, framed: true, weight: 2.5 },
  { key: "notification-settings", Component: NotificationSettings, weight: 4 },
  { key: "badge", Component: BadgeExample, framed: true, weight: 1 },
  { key: "status-badges", Component: StatusBadges, framed: true, weight: 1.5 },
  { key: "chart-area", Component: ChartAreaStacked, weight: 5 },
  { key: "account-access", Component: AccountAccess, weight: 3 },
  { key: "tabs", Component: TabsExample, framed: true, weight: 4 },
  { key: "card-dash", Component: CardDashExample, weight: 2.5 },
  { key: "claimable-balance", Component: ClaimableBalance, weight: 3 },
  { key: "input", Component: InputExample, framed: true, weight: 2.5 },
  { key: "switch", Component: SwitchExample, framed: true, weight: 2 },
  { key: "calendar", Component: CalendarExample, weight: 5 },
  { key: "contribution-history", Component: ContributionHistory, weight: 3 },
  { key: "checkbox", Component: CheckboxExample, framed: true, weight: 3 },
  { key: "slider", Component: SliderExample, framed: true, weight: 1.5 },
  { key: "select", Component: SelectExample, framed: true, weight: 1.5 },
  { key: "dividend-income", Component: DividendIncome, weight: 4 },
  { key: "chart-line", Component: ChartLineMultiple, weight: 5 },
  { key: "alert", Component: AlertExample, framed: true, weight: 3 },
  { key: "status-alerts", Component: AlertSoftExample, framed: true, weight: 3 },
  { key: "progress", Component: ProgressExample, framed: true, weight: 0.8 },
  { key: "toggle-group", Component: ToggleGroupExample, framed: true, weight: 2 },
  { key: "new-milestone", Component: NewMilestone, weight: 2.5 },
  { key: "avatar", Component: AvatarExample, framed: true, weight: 1 },
  { key: "radio-group", Component: RadioGroupExample, framed: true, weight: 3 },
  { key: "field", Component: FieldExample, framed: true, weight: 6 },
  { key: "empty", Component: EmptyDistributeTrack, weight: 3 },
  { key: "accordion", Component: AccordionExample, framed: true, weight: 3 },
  { key: "input-otp", Component: InputOTPExample, framed: true, weight: 2.5 },
  { key: "table", Component: TableExample, framed: true, weight: 5 },
  { key: "pagination", Component: PaginationExample, framed: true, weight: 1 },
]

/** Places items into columns, each into the shortest one so far (a masonry layout). */
function toColumns(items: Item[], count: number) {
  const columns: Item[][] = Array.from({ length: count }, () => [])
  const heights = new Array<number>(count).fill(0)
  for (const item of items) {
    const i = heights.indexOf(Math.min(...heights))
    columns[i].push(item)
    heights[i] += item.weight + 0.5
  }
  return columns
}

function columnsFor(width: number) {
  if (width >= 1400) return 4
  if (width >= 1000) return 3
  if (width >= 620) return 2
  return 1
}

function PreviewItem({ item }: { item: Item }) {
  const { Component } = item
  if (!item.framed) return <Component />
  return (
    <View className="w-full items-center overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
      <View className="w-full items-center">
        <Component />
      </View>
    </View>
  )
}

export interface CreatePreviewProps extends Partial<CreateOptions> {
  mode?: Mode
  className?: string
  /** Initial column count, until the preview has measured its width. */
  columns?: number
}

/**
 * The Create page's preview: the components under a nested ThemeProvider built
 * from the options, in a masonry grid that fits the available width.
 */
export function CreatePreview({ mode = "light", className, columns: initialColumns = 3, ...options }: CreatePreviewProps) {
  const [columns, setColumns] = React.useState(initialColumns)
  const props = themeProps({ ...DEFAULT_OPTIONS, ...options })
  const onLayout = (e: LayoutChangeEvent) => setColumns(columnsFor(e.nativeEvent.layout.width))
  const grid = React.useMemo(() => toColumns(ITEMS, columns), [columns])

  return (
    <ThemeProvider forcedTheme={mode} portalHost={false} {...props}>
      {/* shadcn's preview-02 canvas: `bg-muted dark:bg-background`, so the base color tints it in both modes. */}
      <View className={cn("min-h-0 flex-1 overflow-hidden bg-muted dark:bg-background", className)} onLayout={onLayout}>
        <ScrollView className="flex-1" contentContainerClassName="flex-row items-start gap-4 p-4 md:gap-6 md:p-6">
          {grid.map((column, i) => (
            <View key={i} className="min-w-0 flex-1 gap-4 md:gap-6">
              {column.map((item) => (
                <PreviewItem key={item.key} item={item} />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </ThemeProvider>
  )
}
