import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as TabsPrimitive from "@rn-primitives/tabs"
import { styled, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"

const TabsRoot = styled(TabsPrimitive.Root)
const TabsListRoot = styled(TabsPrimitive.List)
const TabsTriggerRoot = styled(TabsPrimitive.Trigger, { interactive: true })
const TabsContentRoot = styled(TabsPrimitive.Content)

type TabsProps = Omit<React.ComponentProps<typeof TabsRoot>, "value" | "onValueChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function Tabs({
  className,
  orientation = "horizontal",
  value: valueProp,
  defaultValue = "",
  onValueChange,
  ...props
}: TabsProps) {
  const [value, setValue] = useControllableState({ prop: valueProp, defaultProp: defaultValue, onChange: onValueChange })
  return (
    <TabsRoot
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      value={value}
      onValueChange={setValue}
      className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsListRoot> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsListRoot
      data-slot="tabs-list"
      data-variant={variant}
      role="tablist"
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  value,
  disabled,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TabsTriggerRoot>, "children"> & { children?: React.ReactNode }) {
  const root = TabsPrimitive.useRootContext()
  const state = root.value === value ? "active" : "inactive"
  return (
    <TabsTriggerRoot
      data-slot="tabs-trigger"
      data-state={state}
      data-disabled={disabled ? "" : undefined}
      role="tab"
      aria-selected={state === "active"}
      value={value}
      disabled={disabled}
      className={cn(
        // `self-stretch` in place of `h-[calc(100%-1px)]`: fill the list's height. `grow` in place of
        // `flex-1`: a zero flex basis would squeeze triggers in a fit-content list on native.
        "relative inline-flex self-stretch grow items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground",
        className
      )}
      {...props}
    >
      {renderTextChildren(children, undefined, { numberOfLines: 1 })}
      {/* The `after:` underline of the line variant, as a real view. */}
      <View
        style={{ pointerEvents: "none" }}
        data-state={state}
        className="absolute bg-foreground opacity-0 transition-opacity group-data-[orientation=horizontal]/tabs:inset-x-0 group-data-[orientation=horizontal]/tabs:bottom-[-5px] group-data-[orientation=horizontal]/tabs:h-0.5 group-data-[orientation=vertical]/tabs:inset-y-0 group-data-[orientation=vertical]/tabs:-right-1 group-data-[orientation=vertical]/tabs:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:opacity-100"
      />
    </TabsTriggerRoot>
  )
}

function TabsContent({ className, children, ...props }: React.ComponentProps<typeof TabsContentRoot>) {
  return (
    <TabsContentRoot data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props}>
      {props.asChild ? children : renderTextChildren(children)}
    </TabsContentRoot>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, type TabsProps }
