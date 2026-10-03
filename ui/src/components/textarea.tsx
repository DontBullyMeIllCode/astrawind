import * as React from "react"
import type { TextInput as RNTextInput } from "react-native"
import { TextInput } from "@astrawind/css"
import { useFieldControl } from "../lib/field-control"
import { composeRefs } from "../lib/overlay"
import { cn } from "../lib/utils"

// `field-sizing-content` is native behavior: a multiline TextInput grows with its content.
function Textarea({ className, ref, ...props }: React.ComponentProps<typeof TextInput>) {
  const inputRef = React.useRef<RNTextInput | null>(null)
  // Pressing a `<Label htmlFor>` or the enclosing FieldLabel focuses it, like a web `<label>`.
  useFieldControl({ focus: () => inputRef.current?.focus(), disabled: props.editable === false }, props.nativeID)
  return (
    <TextInput
      ref={composeRefs(ref as React.Ref<RNTextInput>, inputRef)}
      data-slot="textarea"
      multiline
      textAlignVertical="top"
      aria-disabled={props.editable === false || undefined}
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
