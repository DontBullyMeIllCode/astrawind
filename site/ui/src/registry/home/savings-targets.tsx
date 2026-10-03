import { Text } from "@astrawind/css"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Item, ItemContent, ItemDescription, ItemFooter, ItemGroup } from "@astrawind/ui/item"
import { Progress } from "@astrawind/ui/progress"

export function SavingsTargets() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Targets</CardTitle>
        <CardDescription>
          Active milestones for 2024 across your portfolio. Monitor how close you are to each savings goal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-3">
          <Item role="listitem" variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-3">
              <ItemDescription className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Retirement
              </ItemDescription>
              <Text className="text-3xl font-semibold tabular-nums">$420,000</Text>
              <Progress value={65} aria-label="Retirement savings progress" />
            </ItemContent>
            <ItemFooter>
              <Text className="text-sm text-muted-foreground">65% achieved</Text>
              <Text className="text-sm font-medium tabular-nums">$273,000</Text>
            </ItemFooter>
          </Item>
          <Item role="listitem" variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-3">
              <ItemDescription className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Real Estate
              </ItemDescription>
              <Text className="text-3xl font-semibold tabular-nums">$85,000</Text>
              <Progress value={32} aria-label="Real estate savings progress" />
            </ItemContent>
            <ItemFooter>
              <Text className="text-sm text-muted-foreground">32% achieved</Text>
              <Text className="text-sm font-medium tabular-nums">$27,200</Text>
            </ItemFooter>
          </Item>
        </ItemGroup>
      </CardContent>
      <CardFooter>
        {/* `text-center` on a text that fills the footer row. */}
        <CardDescription className="flex-1 text-center">You have not met your targets for this year.</CardDescription>
      </CardFooter>
    </Card>
  )
}
