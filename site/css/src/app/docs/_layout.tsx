import * as React from "react"
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView as RNScrollView } from "react-native"
import { Slot, usePathname } from "expo-router"
import { ScrollView, View } from "@astrawind/css"
import { OnThisPage } from "@/docs/on-this-page"
import { Sidebar } from "@/docs/sidebar"
import { TocProvider, useTocState } from "@/docs/toc"

/**
 * The docs shell, laid out like tailwindcss.com/docs: the navigation on the left,
 * the page in the middle and "On this page" on the right. The header, and the
 * navigation sheet below `lg`, are in the root layout.
 */
export default function DocsLayout() {
  const pathname = usePathname()
  const scrollRef = React.useRef<RNScrollView | null>(null)
  const { value: toc, onScroll, contentRef } = useTocState(scrollRef)

  // A new page starts at the top.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [pathname])

  return (
    <TocProvider value={toc}>
      <View className="flex-1 flex-row">
        <Sidebar className="w-72 shrink-0 grow-0 border-r max-lg:hidden" />
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          scrollEventThrottle={32}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => onScroll(e.nativeEvent.contentOffset.y)}
        >
          <View ref={contentRef} className="w-full max-w-3xl self-center px-4 pt-10 pb-24 sm:px-6 lg:px-8">
            <Slot />
          </View>
        </ScrollView>
        <View className="w-64 shrink-0 max-xl:hidden">
          <OnThisPage />
        </View>
      </View>
    </TocProvider>
  )
}
