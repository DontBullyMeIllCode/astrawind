import * as React from "react";
import { useColorScheme } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import {
  AstraWindProvider,
  TextRoot,
  type AstraWindTheme,
  type FontResolver,
} from "@astrawind/css";
import {
  baseColors,
  themeColors,
  type BaseColor,
  type ThemeColor,
} from "./generated/themes";

export { baseColors, themeColors, type BaseColor, type ThemeColor };

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** CSS variables in shadcn's registry shape (`cssVars` in `registry-item.json`), without `--`. */
export interface CssVars {
  /** Always applied, like `@theme`. */
  theme?: Record<string, string>;
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

export interface CreateThemeOptions {
  /** shadcn's base color. Defaults to "neutral". */
  baseColor?: BaseColor;
  /** Optional theme color layered over the base color (primary, charts, sidebar primary). */
  themeColor?: ThemeColor;
  /** `--radius`. Defaults to the base color's (0.625rem). */
  radius?: string;
  /** Extra or overriding variables. */
  cssVars?: CssVars;
  /** Maps font families and weights to native font names. Defaults to the system font. */
  fonts?: FontResolver;
}

/** The `@theme inline` block shadcn adds to your CSS on `init`. */
const THEME_INLINE: Record<string, string> = {
  "radius-sm": "calc(var(--radius) - 4px)",
  "radius-md": "calc(var(--radius) - 2px)",
  "radius-lg": "var(--radius)",
  "radius-xl": "calc(var(--radius) + 4px)",
  "radius-2xl": "calc(var(--radius) + 8px)",
  "radius-3xl": "calc(var(--radius) + 12px)",
  "radius-4xl": "calc(var(--radius) + 16px)",
};
for (const name of [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "info",
  "info-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "error",
  "error-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
]) {
  THEME_INLINE[`color-${name}`] = `var(--${name})`;
}

/**
 * Status colors, beyond shadcn's palette (like daisyUI's info, success, warning and error),
 * styled as shadcn styles `destructive`: white text on the color, which components show at
 * 60% in dark mode. `error` is `--destructive`. The shades are Tailwind's, picked so white
 * text has at least 4.5:1 contrast in both modes. Override any of them with `cssVars`.
 */
export const statusColors = {
  light: {
    info: "oklch(0.546 0.245 262.881)",
    "info-foreground": "oklch(1 0 0)",
    success: "oklch(0.527 0.154 150.069)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(.646 0.222 41.116)",
    "warning-foreground": "oklch(1 0 0)",
    error: "var(--destructive)",
    "error-foreground": "oklch(1 0 0)",
  },
  dark: {
    info: "oklch(0.707 0.165 254.624)",
    "info-foreground": "oklch(1 0 0)",
    success: "oklch(0.723 0.219 149.579)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(.750 0.183 55.934)",
    "warning-foreground": "oklch(1 0 0)",
    error: "var(--destructive)",
    "error-foreground": "oklch(1 0 0)",
  },
} as const;

/** Uses the platform's system font for every font family. */
export const systemFonts: FontResolver = (_family, weight, style) => ({
  fontFamily: undefined,
  fontWeight: weight,
  fontStyle: style,
});

/**
 * Builds the @astrawind/css theme for shadcn's tokens: the same variables
 * `npx shadcn init` writes to your CSS.
 */
export function createTheme({
  baseColor = "neutral",
  themeColor,
  radius,
  cssVars,
  fonts = systemFonts,
}: CreateThemeOptions = {}): AstraWindTheme {
  const base = baseColors[baseColor];
  const accent = themeColor ? themeColors[themeColor] : undefined;
  // shadcn declares `--radius` once, in `:root`, so it applies in dark mode too.
  const baseRadius = (base.light as Record<string, string>).radius;
  return {
    vars: { ...THEME_INLINE, radius: radius ?? baseRadius, ...cssVars?.theme },
    light: {
      ...statusColors.light,
      ...base.light,
      ...accent?.light,
      ...(radius && { radius }),
      ...cssVars?.light,
    },
    dark: {
      ...statusColors.dark,
      ...base.dark,
      ...accent?.dark,
      ...(radius && { radius }),
      ...cssVars?.dark,
    },
    fonts,
    // shadcn's base layer: `* { @apply border-border outline-ring/50 }`.
    outlineColor: "color-mix(in oklab, var(--color-ring) 50%, transparent)",
  };
}

export interface ThemeContextValue {
  /** The selected theme, including "system". */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** The theme in effect: "light" or "dark". */
  resolvedTheme: ResolvedTheme;
  /** The OS color scheme. */
  systemTheme: ResolvedTheme;
  themes: Theme[];
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps extends CreateThemeOptions {
  children?: React.ReactNode;
  /** Initial theme. Defaults to "system". */
  defaultTheme?: Theme;
  /** Forces a theme regardless of the selection, e.g. for a screen that is always dark. */
  forcedTheme?: ResolvedTheme;
  /** Called when `setTheme` runs, e.g. to persist the choice. */
  onThemeChange?: (theme: Theme) => void;
  /** A complete @astrawind/css theme, instead of building one from the options above. */
  value?: AstraWindTheme;
  /** Renders a `PortalHost` for dialogs, menus, popovers and toasts. Defaults to true. */
  portalHost?: boolean;
}

/** shadcn's base layer: `body { @apply bg-background text-foreground }`. */
const BASE_TEXT = "font-sans text-base text-foreground";

/**
 * Applies shadcn's theme and light/dark mode. Render it once, at the root:
 *
 *   <ThemeProvider defaultTheme="system" baseColor="neutral">
 *     <App />
 *   </ThemeProvider>
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  forcedTheme,
  onThemeChange,
  value,
  portalHost = true,
  baseColor,
  themeColor,
  radius,
  cssVars,
  fonts,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const systemTheme: ResolvedTheme =
    useColorScheme() === "dark" ? "dark" : "light";
  const resolvedTheme =
    forcedTheme ?? (theme === "system" ? systemTheme : theme);

  const onThemeChangeRef = React.useRef(onThemeChange);
  onThemeChangeRef.current = onThemeChange;
  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    onThemeChangeRef.current?.(next);
  }, []);

  const context = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
      themes: ["light", "dark", "system"],
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  // Theme identity drives @astrawind/css's style cache, so keep it stable.
  const cssVarsKey = JSON.stringify(cssVars ?? null);
  const built = React.useMemo(
    () =>
      value ?? createTheme({ baseColor, themeColor, radius, cssVars, fonts }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, baseColor, themeColor, radius, cssVarsKey, fonts],
  );

  return (
    <ThemeContext.Provider value={context}>
      <AstraWindProvider theme={built} colorScheme={resolvedTheme}>
        <TextRoot className={BASE_TEXT}>
          {children}
          {portalHost && <PortalHost />}
        </TextRoot>
      </AstraWindProvider>
    </ThemeContext.Provider>
  );
}

const FALLBACK: ThemeContextValue = {
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
  systemTheme: "light",
  themes: ["light", "dark", "system"],
};

/** The current theme and a setter, like `next-themes`' `useTheme()`. */
export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext) ?? FALLBACK;
}
