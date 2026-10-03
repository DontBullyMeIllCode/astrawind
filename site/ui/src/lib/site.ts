import type { Href } from "expo-router"

export const siteConfig = {
  name: "astrawind/ui",
  description:
    "shadcn/ui for React Native. The same composable, accessible components, props and classes, styled with Tailwind by @astrawind/css.",
  navItems: [
    { href: "/", label: "Home" },
    { href: "/docs/installation", label: "Docs" },
    { href: "/docs/components", label: "Components" },
    { href: "/charts/area", label: "Charts" },
    { href: "/create", label: "Create" },
  ] satisfies { href: Href; label: string }[],
}
