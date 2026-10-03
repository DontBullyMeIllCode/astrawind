import * as React from "react"
import * as LabelPrimitive from "@rn-primitives/label"
import { styled, type ClassNameProps } from "@astrawind/css"
import { activateControl } from "../lib/field-control"
import { cn } from "../lib/utils"

const LabelRoot = styled(LabelPrimitive.Root, {
  interactive: true,
}) as unknown as React.ComponentType<LabelPrimitive.RootProps & ClassNameProps>
const LabelText = styled(LabelPrimitive.Text, { kind: "text" })

type LabelProps = Omit<React.ComponentProps<typeof LabelText>, "children" | "htmlFor"> &
  Pick<LabelPrimitive.RootProps, "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "disabled"> & {
    children?: React.ReactNode
    /** The `nativeID` of the control this label is for: pressing the label presses or focuses it. */
    htmlFor?: string
  }

function Label({ className, htmlFor, onPress, onLongPress, onPressIn, onPressOut, disabled, children, ...props }: LabelProps) {
  return (
    <LabelRoot
      data-slot="label"
      onPress={(e) => {
        onPress?.(e)
        // Like a web `<label for>`: toggle or focus the control with this `nativeID`.
        if (htmlFor) activateControl(htmlFor)
      }}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      aria-disabled={disabled ?? undefined}
      className={cn(
        // `disabled:opacity-50` stands in for `peer-disabled:*`: pass `disabled` with the control's.
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 disabled:opacity-50",
        className
      )}
    >
      {React.Children.map(children, (child) =>
        typeof child === "string" || typeof child === "number" ? <LabelText {...props}>{child}</LabelText> : child
      )}
    </LabelRoot>
  )
}

export { Label, type LabelProps }
