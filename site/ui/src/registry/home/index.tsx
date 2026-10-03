import MessageScrollerExample from "@examples/message-scroller"
import { View } from "@astrawind/css"
import { cn } from "@astrawind/ui"

import { AccountAccess } from "./account-access"
import { AnalyticsCard } from "./analytics-card"
import { ClaimableBalance } from "./claimable-balance"
import { ContributionHistory } from "./contribution-history"
import { DividendIncome } from "./dividend-income"
import { EmptyDistributeTrack } from "./empty-distribute-track"
import { NewMilestone } from "./new-milestone"
import { NotificationSettings } from "./notification-settings"
import { Payments } from "./payments"
import { PayoutThreshold } from "./payout-threshold"
import { PowerUsage } from "./power-usage"
import { QrConnect } from "./qr-connect"
import { SavingsTargets } from "./savings-targets"
import { SidebarNav } from "./sidebar-nav"
import { UIElements } from "./ui-elements"

// `--gap`: `--spacing(8)`, `lg:--spacing(6)`, `min-[1900px]:--spacing(10)`. Phones (which upstream
// doesn't render: it shows a screenshot) get `gap-6`.
const GAP = "gap-6 md:gap-8 lg:gap-6 min-[1900px]:gap-10"

// Upstream's grid of columns, as a masonry: a row of flex-col stacks. The columns show from the
// same breakpoints: 1 on phones, 2 from md, 3 from lg, 4 from 1400px and 5 from 1900px.
const COLUMN = cn("min-w-0 flex-1 flex-col", GAP)

/**
 * The cards on the home page. `theme-neutral` and the skeleton rails (decoration for
 * ultra-wide screens) are left out.
 */
export function CardsDemo() {
  return (
    <View
      data-slot="demo"
      className={cn(
        "relative flex w-full max-w-none flex-col overflow-hidden bg-muted p-4 md:p-12 lg:p-6 min-[1900px]:p-12 dark:bg-background",
        "pb-0!",
        GAP
      )}
    >
      <View className="pointer-events-none absolute inset-x-0 top-0 z-1 h-120 bg-linear-to-b from-background via-muted to-transparent dark:hidden" />
      <View
        className={cn(
          "relative z-10 mx-auto flex w-full md:max-w-3xl lg:max-w-none xl:max-w-[1600px] 2xl:max-w-[1900px]",
          GAP
        )}
      >
        <View className={cn("flex", COLUMN)}>
          <UIElements />
          <SidebarNav />
          <SavingsTargets />
        </View>
        <View className={cn("hidden lg:flex", COLUMN)}>
          <ContributionHistory />
          <ClaimableBalance />
          <DividendIncome />
        </View>
        <View className={cn("hidden min-[1400px]:flex", COLUMN)}>
          <NewMilestone />
          <PayoutThreshold />
          <AccountAccess />
        </View>
        <View className={cn("hidden md:flex", COLUMN)}>
          <QrConnect />
          {/* The example has a border but no background; the other cards sit on `bg-card`. */}
          <View className="rounded-xl bg-card">
            <MessageScrollerExample />
          </View>
          {/* <TransferFunds /> */}
          <Payments />
        </View>
        <View className={cn("hidden min-[1900px]:flex", COLUMN)}>
          <EmptyDistributeTrack />
          <AnalyticsCard />
          <NotificationSettings />
          <PowerUsage />
        </View>
      </View>
      {/* `pointer-events-none` (not upstream): the fade covers the bottom cards, which stay pressable. */}
      <View className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-background via-muted/80 to-transparent lg:h-80 xl:h-64 dark:via-background/80" />
    </View>
  )
}
