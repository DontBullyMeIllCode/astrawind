import * as React from "react"
import { router, useLocalSearchParams } from "expo-router"
import { View } from "@astrawind/css"
import { useTheme } from "@astrawind/ui"
import { Customizer } from "@/components/create/customizer"
import { Seo } from "@/components/seo"
import { parseMode, parseOptions, toParams, type CreateOptions, type Mode } from "@/lib/create"
import { CreatePreview } from "@/registry/create/preview"

/**
 * /create, like ui.shadcn.com/create: pick a base color, theme, chart color,
 * radius and menu style, see the components restyled, and get the
 * ThemeProvider for it. The options live in the URL, so a design can be shared.
 */
export default function CreatePage() {
  const params = useLocalSearchParams<Record<string, string>>()
  const options = React.useMemo(() => parseOptions(params), [params])
  const { resolvedTheme } = useTheme()
  // Without a `mode` param, the preview follows the site's theme.
  const mode = parseMode(params) ?? resolvedTheme

  const setOptions = React.useCallback((next: CreateOptions) => router.setParams(toParams(next)), [])
  const setMode = React.useCallback(
    (next: Mode) => router.setParams({ mode: next === resolvedTheme ? undefined : next }),
    [resolvedTheme]
  )

  return (
    <View className="min-h-0 flex-1 flex-col gap-4 bg-muted/30 p-4 md:flex-row-reverse md:gap-6 md:p-6">
      <Seo
        title="Create - astrawind/ui"
        description="Pick a base color, theme, chart color, radius and menu style, preview the components restyled, and copy the ThemeProvider for your design."
        path="/create"
      />
      <View className="min-h-0 flex-1 overflow-hidden rounded-2xl border shadow-sm">
        <CreatePreview {...options} mode={mode} />
      </View>
      <Customizer options={options} mode={mode} onOptionsChange={setOptions} onModeChange={setMode} />
    </View>
  )
}
