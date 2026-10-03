import * as React from "react";
import { Link, usePathname, type Href } from "expo-router";
import { MenuIcon, MoonIcon, SunIcon } from "lucide-react-native";
import { ScrollView, Text, View } from "@astrawind/css";
import { useTheme } from "@astrawind/ui";
import { Button } from "@astrawind/ui/button";
import { Icon } from "@astrawind/ui/icon";
import { Separator } from "@astrawind/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@astrawind/ui/sheet";
import { saveTheme } from "@/components/theme-persistence";
import { BoxLink } from "@/components/link";
import { docsNav } from "@/lib/docs";
import { siteConfig } from "@/lib/site";

export function Logo({ className }: { className?: string }) {
  return (
    <View className="flex items-center justify-center gap-2">
      <View
        className={`size-6 items-center justify-center rounded-md bg-primary ${className ?? ""}`}
      >
        <Text className="text-[13px] font-bold text-primary-foreground">A</Text>
      </View>
      <Text className="text-xl font-semibold tracking-tight">
        AstraWind<Text className="text-primary">UI</Text>
      </Text>
    </View>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // "Docs" is active across the docs, except on component pages ("Components").
  if (href === "/docs/installation")
    return (
      pathname.startsWith("/docs") && !pathname.startsWith("/docs/components")
    );
  if (href.startsWith("/charts")) return pathname.startsWith("/charts");
  return pathname.startsWith(href);
}

function MainNav() {
  const pathname = usePathname();
  return (
    <View className="flex-row items-center gap-0.5 max-lg:hidden">
      {siteConfig.navItems.map((item) => (
        <Link key={item.label} href={item.href} asChild>
          <Button variant="ghost" size="sm" className="px-2.5">
            <Text
              className={
                isActive(pathname, item.href)
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {item.label}
            </Text>
          </Button>
        </Link>
      ))}
    </View>
  );
}

function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle menu"
          className="lg:hidden"
        >
          <Icon as={MenuIcon} className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 p-4 pb-12"
        >
          <View className="gap-1">
            {siteConfig.navItems.map((item) => (
              <BoxLink
                key={item.label}
                href={item.href}
                onPress={close}
                className="py-1.5"
              >
                <Text className="text-2xl font-medium">{item.label}</Text>
              </BoxLink>
            ))}
          </View>
          {docsNav.map((section) => (
            <View key={section.title} className="gap-2">
              <Text className="text-sm font-medium text-muted-foreground">
                {section.title}
              </Text>
              {section.items.map((item) => (
                <BoxLink
                  key={item.href as string}
                  href={item.href}
                  onPress={close}
                >
                  <Text className="text-lg">{item.title}</Text>
                </BoxLink>
              ))}
            </View>
          ))}
        </ScrollView>
      </SheetContent>
    </Sheet>
  );
}

function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onPress={() => {
        setTheme(next);
        saveTheme(next);
      }}
    >
      <Icon
        as={resolvedTheme === "dark" ? SunIcon : MoonIcon}
        className="size-4.5"
      />
    </Button>
  );
}

/** The top bar: logo, main navigation and the theme toggle, like ui.shadcn.com's. */
export function SiteHeader() {
  return (
    <View className="z-50 w-full border-b bg-background">
      <View className="h-14 w-full flex-row items-center gap-2 px-4 lg:px-6">
        <MobileNav />
        <BoxLink
          href="/"
          aria-label="Home"
          className="mr-2 flex-row items-center gap-2 max-lg:hidden"
        >
          <Logo />
        </BoxLink>
        <MainNav />
        <View className="flex-1" />
        <Separator orientation="vertical" className="my-4" />
        <ModeToggle />
      </View>
    </View>
  );
}

export type { Href };
