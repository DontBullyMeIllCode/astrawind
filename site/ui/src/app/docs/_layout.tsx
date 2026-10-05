import * as React from "react"
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView as RNScrollView } from "react-native"
import { Slot, usePathname } from "expo-router"
import { ScrollView, View } from "@astrawind/css"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { OnThisPage } from "@/components/docs/on-this-page"
import { TocProvider, useTocState } from "@/components/docs/toc"
import { SiteFooter } from "@/components/site-footer"

/** The docs shell, like ui.shadcn.com/docs: sidebar, page, and "On This Page". */
export default function DocsLayout() {
  const pathname = usePathname()
  const scrollRef = React.useRef<RNScrollView | null>(null)
  const { value: toc, onScroll, contentRef } = useTocState(scrollRef)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [pathname])

  return (
    <TocProvider value={toc}>
      <View className="flex-1 flex-row">
        <DocsSidebar className="w-64 shrink-0 grow-0 border-r max-lg:hidden" />
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          scrollEventThrottle={32}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => onScroll(e.nativeEvent.contentOffset.y)}
        >
          <View ref={contentRef} className="w-full max-w-3xl self-center px-4 pt-8 pb-16 md:px-8">
            <Slot />
          </View>
          <SiteFooter />
        </ScrollView>
        <View className="w-56 shrink-0 max-xl:hidden">
          <OnThisPage />
        </View>
      </View>
    </TocProvider>
  )
}
