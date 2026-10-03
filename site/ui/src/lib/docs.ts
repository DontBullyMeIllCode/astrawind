import type { Href } from "expo-router"
import components from "@/generated/components.json"

export interface ComponentDoc {
  name: string
  title: string
  description: string
  imports: string[]
  example: string | null
  /** Examples beyond shadcn's demo (test/examples/<name>.<slug>.tsx). */
  extras: { slug: string; title: string; source: string }[]
}

export const componentDocs = components as ComponentDoc[]

export interface DocsNavItem {
  title: string
  href: Href
}

export interface DocsNavSection {
  title: string
  items: DocsNavItem[]
}

/** Guide pages, in sidebar order. Each has a route in src/app/docs/. */
export const guides = [
  { slug: "", title: "Introduction", description: "shadcn/ui for React Native, styled with Tailwind." },
  { slug: "installation", title: "Installation", description: "How to install and set up @astrawind/ui in your Expo or React Native app." },
  { slug: "theming", title: "Theming", description: "Using CSS variables and base colors to theme your components." },
  { slug: "dark-mode", title: "Dark Mode", description: "Adding dark mode to your app." },
  { slug: "react-native", title: "React Native", description: "What changes when shadcn/ui runs on native, and why." },
] as const

export const docsNav: DocsNavSection[] = [
  {
    title: "Getting Started",
    items: guides.map((g) => ({ title: g.title, href: (g.slug ? `/docs/${g.slug}` : "/docs") as Href })),
  },
  {
    title: "Components",
    items: componentDocs.map((c) => ({ title: c.title, href: `/docs/components/${c.name}` as Href })),
  },
]

const flat = docsNav.flatMap((s) => s.items)

/** Previous and next pages, in sidebar order. */
export function neighbours(pathname: string) {
  const i = flat.findIndex((item) => item.href === pathname)
  return { prev: i > 0 ? flat[i - 1] : undefined, next: i >= 0 ? flat[i + 1] : undefined }
}
