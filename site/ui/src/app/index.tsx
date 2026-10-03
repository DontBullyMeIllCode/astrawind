import * as React from "react"
import { Link } from "expo-router"
import Head from "expo-router/head"
import { ScrollView, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Announcement, PageActions, PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { SiteFooter } from "@/components/site-footer"
import { siteConfig } from "@/lib/site"
import { CardsDemo } from "@/registry/home"

const title = "The Foundation for your Design System, on Native"

export default function IndexPage() {
  return (
    <ScrollView className="flex-1">
      <Head>
        <title>{`${siteConfig.name} - ${title}`}</title>
        <meta name="description" content={siteConfig.description} />
      </Head>
      <PageHeader className="border-b-0 md:pb-8 lg:pb-12">
        <Announcement href="/charts/area">Radar and radial charts are here</Announcement>
        <PageHeaderHeading>{title}</PageHeaderHeading>
        <PageHeaderDescription>{siteConfig.description}</PageHeaderDescription>
        <PageActions>
          <Link href="/docs/installation" asChild>
            <Button size="sm" className="h-[35px]">
              Get Started
            </Button>
          </Link>
          <Link href="/docs/components" asChild>
            <Button size="sm" variant="secondary">
              View Components
            </Button>
          </Link>
        </PageActions>
      </PageHeader>
      <View className="w-full px-4 pb-12 lg:px-6">
        <CardsDemo />
      </View>
      <SiteFooter />
    </ScrollView>
  )
}
