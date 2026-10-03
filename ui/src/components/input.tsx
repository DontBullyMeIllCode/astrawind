import * as React from "react"
import type { TextInput as RNTextInput } from "react-native"
import { TextInput } from "@astrawind/css"
import { useFieldControl } from "../lib/field-control"
import { composeRefs } from "../lib/overlay"
import { cn } from "../lib/utils"

// `file:*` classes are left out: React Native has no file input.
function Input({ className, ref, ...props }: React.ComponentProps<typeof TextInput>) {
  const inputRef = React.useRef<RNTextInput | null>(null)
  // Pressing a `<Label htmlFor>` or the enclosing FieldLabel focuses it, like a web `<label>`.
  useFieldControl({ focus: () => inputRef.current?.focus(), disabled: props.editable === false }, props.nativeID)
  return (
    <TextInput
      ref={composeRefs(ref as React.Ref<RNTextInput>, inputRef)}
      data-slot="input"
      aria-disabled={props.editable === false || undefined}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
