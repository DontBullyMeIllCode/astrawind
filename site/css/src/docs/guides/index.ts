import type * as React from "react"
import AddingCustomStyles from "./adding-custom-styles"
import Colors from "./colors"
import Compatibility from "./compatibility"
import DarkMode from "./dark-mode"
import EditorSetup from "./editor-setup"
import HooksAndComponents from "./hooks-and-components"
import States from "./hover-focus-and-other-states"
import Installation from "./installation"
import Preflight from "./preflight"
import ResponsiveDesign from "./responsive-design"
import Runtime from "./runtime"
import StylingWithUtilityClasses from "./styling-with-utility-classes"
import Theme from "./theme"

/** Guide page content by slug. Utility pages are generated from the class data. */
export const guides: Record<string, React.ComponentType> = {
  installation: Installation,
  "editor-setup": EditorSetup,
  compatibility: Compatibility,
  "styling-with-utility-classes": StylingWithUtilityClasses,
  "hover-focus-and-other-states": States,
  "responsive-design": ResponsiveDesign,
  "dark-mode": DarkMode,
  theme: Theme,
  colors: Colors,
  "adding-custom-styles": AddingCustomStyles,
  runtime: Runtime,
  "hooks-and-components": HooksAndComponents,
  preflight: Preflight,
}
