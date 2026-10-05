import * as React from "react";
import { Link, usePathname } from "expo-router";
import {
  ArrowUpRightIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react-native";
import { Image, Text, View } from "@astrawind/css";
import cssPackage from "@astrawind/css/package.json";
import { useTheme } from "@astrawind/ui";
import { Badge } from "@astrawind/ui/badge";
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
import { Sidebar } from "@/docs/sidebar";
import { BoxLink } from "./link";
import { saveTheme } from "./theme-persistence";

// Images are `require`d so Metro resolves them to an asset on every platform.
const GithubBlackIcon = require("@/assets/images/github/github-black.png");
const GithubWhiteIcon = require("@/assets/images/github/github-white.png");
const UI_SITE = "https://ui.astrawind.io";
const GITHUB_SITE =
  "https://github.com/DontBullyMeIllCode/astrawind/tree/main/css";

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

/** The docs navigation in a sheet, below `lg`. */
function MobileNav() {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="-ml-2 lg:hidden"
        >
          <Icon as={MenuIcon} className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Documentation</SheetTitle>
        </SheetHeader>
        <Sidebar className="flex-1" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export function Logo() {
  return (
    <BoxLink
      href="/"
      className="flex-row items-center gap-2"
      aria-label="AstraWind CSS home"
    >
      <View className="size-6 items-center justify-center rounded-md bg-primary">
        <Text className="text-sm font-bold text-primary-foreground">A</Text>
      </View>
      <Text className="text-xl font-semibold tracking-tight">
        AstraWind<Text className="text-primary">CSS</Text>
      </Text>
    </BoxLink>
  );
}

/** The top bar: logo, version, links and the theme toggle. */
export function Header() {
  const inDocs = usePathname().startsWith("/docs");
  return (
    <View className="z-50 h-14 w-full flex-row items-center gap-3 border-b bg-background px-4 sm:px-6">
      <MobileNav />
      <Logo />
      <Badge color="primary" className="font-mono">
        v{cssPackage.version}
      </Badge>
      <View className="flex-1" />
      <View className="flex-row items-center gap-1 max-sm:hidden">
        <Link href="/docs/installation" asChild>
          <Button variant="ghost" size="sm">
            <Text className={inDocs ? "text-primary" : "text-foreground"}>
              Docs
            </Text>
          </Button>
        </Link>
        <Link href={UI_SITE} asChild>
          <Button size="sm">
            UI
            <Icon as={ArrowUpRightIcon} />
          </Button>
        </Link>
      </View>
      <Separator orientation="vertical" className="my-4 max-sm:hidden" />
      <Link href={GITHUB_SITE} asChild>
        <Button size="icon" variant="ghost">
          <Image
            source={GithubBlackIcon}
            className="size-5 block dark:hidden"
          />
          <Image
            source={GithubWhiteIcon}
            className="size-5 hidden dark:block"
          />
        </Button>
      </Link>
      <Separator orientation="vertical" className="my-4 max-sm:hidden" />
      <ModeToggle />
    </View>
  );
}
