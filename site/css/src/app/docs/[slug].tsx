import * as React from "react"
import { useLocalSearchParams } from "expo-router"
import Head from "expo-router/head"
import { Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Badge } from "@astrawind/ui/badge"
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
    <Badge variant="soft" color={none ? "warning" : "success"} className="mb-6 h-6 px-2.5">
      <View className={cn("size-1.5 rounded-full", none ? "bg-warning" : "bg-success")} />
      {all
        ? "Every class applies on React Native"
        : none
          ? "No native equivalent: these classes are accepted and ignored"
          : `${native} of ${total} classes apply on React Native`}
    </Badge>
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
      <Text className="text-sm/6 font-medium text-link">{section?.title}</Text>
      <Text role="heading" aria-level={1} className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {page.title}
      </Text>
      <Text className="mt-4 mb-12 text-lg/7 text-balance text-muted-foreground">{page.description}</Text>
      {page.kind === "utility" ? <UtilityContent page={page} /> : Guide ? <Guide /> : null}
      <PageNav slug={page.slug} />
    </View>
  )
}
