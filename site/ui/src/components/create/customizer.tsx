import * as React from "react"
import { Platform } from "react-native"
import { CheckIcon, LinkIcon, MoonIcon, SunIcon } from "lucide-react-native"
import { ScrollView, Text, View } from "@astrawind/css"
import { cn, useIsMobile } from "@astrawind/ui"
import { Button } from "@astrawind/ui/button"
import { Card } from "@astrawind/ui/card"
import { Icon } from "@astrawind/ui/icon"
import { Separator } from "@astrawind/ui/separator"
import { GetCodeDialog } from "@/components/create/get-code-dialog"
import { Picker, type PickerOption } from "@/components/create/picker"
import {
  BASE_COLORS,
  baseSwatch,
  chartColorOf,
  DEFAULT_OPTIONS,
  MENU_ACCENTS,
  MENU_COLORS,
  RADII,
  randomOptions,
  THEME_COLORS,
  themeLabel,
  themeSwatch,
  titleCase,
  type CreateOptions,
  type Mode,
  type ThemeChoice,
} from "@/lib/create"

function RadiusIcon() {
  // Upstream's corner glyph, drawn with borders.
  return <View aria-hidden className="size-3.5 rounded-tl-lg border-t-2 border-l-2 border-foreground" />
}

function MenuIndicator({ inverted, bold }: { inverted?: boolean; bold?: boolean }) {
  return (
    <View
      aria-hidden
      className={cn("h-4 w-5 justify-center rounded-sm border px-0.5", inverted ? "border-foreground bg-foreground" : "bg-background")}
    >
      <View className={cn("h-1.5 rounded-[2px]", bold ? "bg-primary" : inverted ? "bg-background/30" : "bg-muted-foreground/30")} />
    </View>
  )
}

function CopyLinkButton({ className }: { className?: string }) {
  const [copied, setCopied] = React.useState(false)
  // Sharing copies the URL, which holds the options; web only.
  if (Platform.OS !== "web") return null
  return (
    <Button
      variant="outline"
      className={className}
      onPress={() => {
        const href = (globalThis as { location?: { href: string } }).location?.href
        if (href) void globalThis.navigator?.clipboard?.writeText(href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      <Icon as={copied ? CheckIcon : LinkIcon} />
      {copied ? "Copied" : "Copy Link"}
    </Button>
  )
}

/**
 * The options card, like ui.shadcn.com/create's customizer: a column of pickers
 * on md and up, a horizontal strip on phones, and the actions below.
 */
export function Customizer({
  options,
  mode,
  onOptionsChange,
  onModeChange,
  className,
}: {
  options: CreateOptions
  mode: Mode
  onOptionsChange: (options: CreateOptions) => void
  onModeChange: (mode: Mode) => void
  className?: string
}) {
  const isMobile = useIsMobile()
  const set = <K extends keyof CreateOptions>(key: K) => (value: string) =>
    onOptionsChange({ ...options, [key]: value as CreateOptions[K] })

  const themeOption = (theme: ThemeChoice): PickerOption => ({
    value: theme,
    label: themeLabel(theme, options.baseColor),
    swatch: themeSwatch(theme, options.baseColor),
  })
  const themeGroups = [{ options: [themeOption("default")] }, { options: THEME_COLORS.map(themeOption) }]
  const chart = chartColorOf(options)
  const isDefault = (Object.keys(DEFAULT_OPTIONS) as (keyof CreateOptions)[]).every((k) => options[k] === DEFAULT_OPTIONS[k])

  const pickers = (
    <>
      <Picker
        label="Base Color"
        value={options.baseColor}
        onValueChange={set("baseColor")}
        groups={[{ options: BASE_COLORS.map((b) => ({ value: b, label: titleCase(b), swatch: baseSwatch(b) })) }]}
      />
      <Picker label="Theme" value={options.theme} onValueChange={set("theme")} groups={themeGroups} />
      <Picker
        label="Chart Color"
        value={chart}
        // Picking the theme's own color follows the theme again.
        onValueChange={(value) => onOptionsChange({ ...options, chartColor: value === options.theme ? null : (value as ThemeChoice) })}
        groups={themeGroups}
      />
      <Separator className="-mx-4 w-auto max-md:hidden" />
      <Picker
        label="Radius"
        value={options.radius}
        onValueChange={set("radius")}
        indicator={<RadiusIcon />}
        groups={[
          { options: RADII.filter((r) => r.name === "default").map((r) => ({ value: r.name, label: r.label })) },
          { options: RADII.filter((r) => r.name !== "default").map((r) => ({ value: r.name, label: r.label })) },
        ]}
      />
      <Separator className="-mx-4 w-auto max-md:hidden" />
      <Picker
        label="Menu"
        value={options.menu}
        onValueChange={set("menu")}
        indicator={<MenuIndicator inverted={options.menu === "inverted"} />}
        groups={[{ options: MENU_COLORS.map((m) => ({ value: m.value, label: m.label })) }]}
      />
      <Picker
        label="Menu Accent"
        value={options.menuAccent}
        onValueChange={set("menuAccent")}
        indicator={<MenuIndicator bold={options.menuAccent === "bold"} />}
        groups={[{ options: MENU_ACCENTS.map((m) => ({ value: m.value, label: m.label })) }]}
      />
      <Picker
        label="Mode"
        value={mode}
        onValueChange={(value) => onModeChange(value as Mode)}
        indicator={<Icon as={mode === "dark" ? MoonIcon : SunIcon} className="size-4 text-foreground" />}
        groups={[
          {
            options: [
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ],
          },
        ]}
      />
    </>
  )

  return (
    <Card
      className={cn(
        "w-full shrink-0 gap-3 self-start rounded-2xl bg-card/90 py-4 md:min-h-0 md:w-56 md:gap-4 md:self-stretch",
        className
      )}
    >
      <View className="flex-row items-center justify-between px-4 max-md:hidden">
        <Text className="text-sm font-semibold">Customize</Text>
      </View>
      {isMobile ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5 px-4 py-px">
          {pickers}
        </ScrollView>
      ) : (
        <ScrollView className="min-h-0 flex-1" contentContainerClassName="gap-3 px-4 py-px">
          {pickers}
          <Text className="pt-1 text-xs leading-relaxed text-muted-foreground">
            Style, icon library, font and base aren't options here: @astrawind/ui is shadcn's new-york style on
            React Native primitives, with lucide icons and the system font.
          </Text>
        </ScrollView>
      )}
      <View className="gap-2 px-4">
        <View className="flex-row gap-2">
          <Button variant="outline" className="flex-1 px-2" onPress={() => onOptionsChange(randomOptions())}>
            Random
          </Button>
          <Button
            variant="outline"
            className="flex-1 px-2"
            disabled={isDefault}
            onPress={() => onOptionsChange(DEFAULT_OPTIONS)}
          >
            Reset
          </Button>
          {isMobile && <GetCodeDialog options={options} className="flex-1 px-2" />}
        </View>
        {!isMobile && <CopyLinkButton className="w-full" />}
        {!isMobile && <GetCodeDialog options={options} className="w-full" />}
      </View>
    </Card>
  )
}
