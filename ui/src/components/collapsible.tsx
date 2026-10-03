import * as React from "react"
import * as CollapsiblePrimitive from "@rn-primitives/collapsible"
import { styled } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { useControllableState } from "../lib/use-controllable-state"

const CollapsibleRoot = styled(CollapsiblePrimitive.Root)
const CollapsibleTriggerRoot = styled(CollapsiblePrimitive.Trigger, { interactive: true })
const CollapsibleContentRoot = styled(CollapsiblePrimitive.Content)

const CollapsibleStateContext = React.createContext<{ open: boolean; disabled?: boolean }>({ open: false })

function dataState(open: boolean, disabled?: boolean) {
  return { "data-state": open ? "open" : "closed", "data-disabled": disabled ? "" : undefined }
}

function Collapsible({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled,
  ...props
}: React.ComponentProps<typeof CollapsibleRoot>) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange })
  const state = React.useMemo(() => ({ open, disabled }), [open, disabled])
  return (
    <CollapsibleStateContext.Provider value={state}>
      <CollapsibleRoot
        data-slot="collapsible"
        {...dataState(open, disabled)}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        {...props}
      />
    </CollapsibleStateContext.Provider>
  )
}

function CollapsibleTrigger({ asChild, children, ...props }: React.ComponentProps<typeof CollapsibleTriggerRoot>) {
  const { open, disabled } = React.useContext(CollapsibleStateContext)
  return (
    <CollapsibleTriggerRoot
      data-slot="collapsible-trigger"
      {...dataState(open, disabled)}
      aria-expanded={open}
      asChild={asChild}
      {...props}
    >
      {asChild || typeof children === "function" ? children : renderTextChildren(children)}
    </CollapsibleTriggerRoot>
  )
}

function CollapsibleContent({ children, ...props }: React.ComponentProps<typeof CollapsibleContentRoot>) {
  const { open } = React.useContext(CollapsibleStateContext)
  return (
    <CollapsibleContentRoot data-slot="collapsible-content" {...dataState(open)} {...props}>
      {props.asChild ? children : renderTextChildren(children)}
    </CollapsibleContentRoot>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
