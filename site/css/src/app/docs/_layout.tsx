import * as React from "react"
import { Modal, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView as RNScrollView } from "react-native"
import { Slot, usePathname } from "expo-router"
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context"
import { Pressable, ScrollView, styled, Text, View } from "@astrawind/css"
import cssPackage from "@astrawind/css/package.json"
import { OnThisPage } from "@/docs/on-this-page"
import { Sidebar } from "@/docs/sidebar"
import { TocProvider, useTocState } from "@/docs/toc"
import { Header } from "@/site/header"

const SafeAreaView = styled(RNSafeAreaView)

function MenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} aria-label="Open navigation" className="-ml-1 gap-1 p-2 lg:hidden">
      <View className="h-0.5 w-4 rounded-full bg-gray-950 dark:bg-white" />
      <View className="h-0.5 w-4 rounded-full bg-gray-950 dark:bg-white" />
      <View className="h-0.5 w-4 rounded-full bg-gray-950 dark:bg-white" />
    </Pressable>
  )
}

/**
 * The docs shell, laid out like tailwindcss.com/docs: a header, the navigation on
 * the left, the page in the middle and "On this page" on the right.
 */
export default function DocsLayout() {
  const pathname = usePathname()
  const scrollRef = React.useRef<RNScrollView | null>(null)
  const toc = useTocState(scrollRef)
  const [menuOpen, setMenuOpen] = React.useState(false)

  // A new page starts at the top.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [pathname])

  return (
    <TocProvider value={toc.value}>
      <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-gray-950">
        <Header version={cssPackage.version} menu={<MenuButton onPress={() => setMenuOpen(true)} />} />
        <View className="flex-1 flex-row">
          <Sidebar className="w-72 shrink-0 grow-0 border-r border-gray-950/5 max-lg:hidden dark:border-white/10" />
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            scrollEventThrottle={32}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => toc.onScroll(e.nativeEvent.contentOffset.y)}
          >
            <View ref={toc.contentRef} className="w-full max-w-3xl self-center px-4 pt-10 pb-24 sm:px-6 lg:px-8">
              <Slot />
            </View>
          </ScrollView>
          <View className="w-64 shrink-0 max-xl:hidden">
            <OnThisPage />
          </View>
        </View>
      </SafeAreaView>

      <Modal visible={menuOpen} animationType="fade" transparent onRequestClose={() => setMenuOpen(false)}>
        <View className="flex-1 flex-row">
          <SafeAreaView className="w-80 max-w-[85%] bg-white shadow-xl dark:bg-gray-950">
            <View className="h-14 flex-row items-center justify-between border-b border-gray-950/5 px-6 dark:border-white/10">
              <Text className="font-semibold text-gray-950 dark:text-white">Documentation</Text>
              <Pressable onPress={() => setMenuOpen(false)} aria-label="Close navigation" className="p-2">
                <Text className="text-lg text-gray-500">✕</Text>
              </Pressable>
            </View>
            <Sidebar className="flex-1" onNavigate={() => setMenuOpen(false)} />
          </SafeAreaView>
          <Pressable className="flex-1 bg-gray-950/40" aria-label="Close navigation" onPress={() => setMenuOpen(false)} />
        </View>
      </Modal>
    </TocProvider>
  )
}
