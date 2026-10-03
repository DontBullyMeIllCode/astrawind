import * as React from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "@astrawind/css";
import { ThemeProvider, useTheme, type Theme } from "@astrawind/ui";
import { SiteHeader } from "@/components/site-header";
import { readTheme } from "@/components/theme-persistence";

const SafeAreaView = styled(RNSafeAreaView);

function Shell() {
  const { resolvedTheme } = useTheme();
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <SiteHeader />
      <Slot />
    </SafeAreaView>
  );
}

/** Restores the saved theme once mounted (static pages render with the default). */
function RestoreTheme() {
  const { setTheme } = useTheme();
  React.useEffect(() => {
    const saved = readTheme();
    if (saved) setTheme(saved);
  }, [setTheme]);
  return null;
}

export default function RootLayout() {
  const [defaultTheme] = React.useState<Theme>("system");
  return (
    <ThemeProvider
      defaultTheme={defaultTheme}
      baseColor="mist"
      themeColor="cyan"
    >
      <RestoreTheme />
      <Shell />
    </ThemeProvider>
  );
}
