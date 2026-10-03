import * as React from "react"
import { useLocalSearchParams } from "expo-router"
import Head from "expo-router/head"
import { Text, View } from "@astrawind/css"
import { guides } from "@/docs/guides"
import { pageBySlug, pages, sectionOf, type UtilityPage } from "@/docs/nav"
import { PageNav } from "@/docs/page-nav"
import { H2, P } from "@/docs/prose"
import { QuickReference, utilityData } from "@/docs/quick-reference"
import { TextLink } from "@/site/link"

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return pages.map((p) => ({ slug: p.slug }))
}

function NativeSupport({ slug }: { slug: string }) {
  const { native, total } = utilityData(slug)
  if (!total) return null
  const all = native === total
  const none = native === 0
  return (
    <View
      className={`mb-6 flex-row items-center gap-2 self-start rounded-full px-3 py-1 ${
        none ? "bg-amber-50 dark:bg-amber-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"
      }`}
    >
      <View className={`size-1.5 rounded-full ${none ? "bg-amber-500" : "bg-emerald-500"}`} />
      <Text className={`text-xs font-medium ${none ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
        {all
          ? "Every class applies on React Native"
          : none
            ? "No native equivalent: these classes are accepted and ignored"
            : `${native} of ${total} classes apply on React Native`}
      </Text>
    </View>
  )
}

function UtilityContent({ page }: { page: UtilityPage }) {
  return (
    <>
      <H2 first>Quick reference</H2>
      <NativeSupport slug={page.slug} />
      <QuickReference slug={page.slug} />
      <P>
        The React Native column is what AstraWind resolves each class to, computed live on this page with the current
        color scheme. Classes with no native equivalent are accepted without effect, and AstraWind warns about them in
        development. See <TextLink href="/docs/compatibility">Compatibility</TextLink>.
      </P>
    </>
  )
}

export default function DocPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const page = pageBySlug(slug)

  if (!page) {
    return (
      <View className="gap-4">
        <Head>
          <title>Page not found - AstraWind</title>
        </Head>
        <Text className="text-3xl font-semibold tracking-tight">Page not found</Text>
        <P>
          There's no docs page at this address. Start with <TextLink href="/docs/installation">Installation</TextLink>.
        </P>
      </View>
    )
  }

  const section = sectionOf(page.slug)
  const Guide = page.kind === "guide" ? guides[page.slug] : undefined
  return (
    <View>
      <Head>
        <title>{`${page.title} - ${section?.title ?? "Docs"} - AstraWind`}</title>
        <meta name="description" content={page.description} />
      </Head>
      <Text className="font-mono text-sm/6 font-medium tracking-widest text-gray-500 uppercase dark:text-gray-400">
        {section?.title}
      </Text>
      <Text role="heading" aria-level={1} className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl dark:text-white">
        {page.title}
      </Text>
      <Text className="mt-4 mb-12 text-lg/7 text-gray-700 dark:text-gray-400">{page.description}</Text>
      {page.kind === "utility" ? <UtilityContent page={page} /> : Guide ? <Guide /> : null}
      <PageNav slug={page.slug} />
    </View>
  )
}
