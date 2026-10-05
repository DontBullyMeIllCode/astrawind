import * as React from "react"
import { usePathname } from "expo-router"
import Head from "expo-router/head"
import { siteConfig } from "@/lib/site"

/**
 * The page's <head>: title, description, canonical URL and the Open Graph and
 * Twitter tags link previews read. `path` defaults to the current pathname.
 */
export function Seo({
  title,
  description,
  path,
  noindex,
}: {
  title: string
  description?: string
  path?: string
  noindex?: boolean
}) {
  const pathname = usePathname()
  const url = siteConfig.url + (path ?? pathname)
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={url} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
    </Head>
  )
}
