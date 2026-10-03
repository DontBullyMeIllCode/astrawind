import * as React from "react"
import * as Slot from "@rn-primitives/slot"
import { Text, View } from "@astrawind/css"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { cn } from "../lib/utils"
import { Label, type LabelProps } from "./label"

/**
 * react-hook-form bindings, as upstream. On React Native, wire the control with
 * `onChangeText={field.onChange}` (or the control's `onValueChange` / `onCheckedChange`),
 * `onBlur={field.onBlur}`, `value={field.value}` and `ref={field.ref}`.
 */
const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    /** `nativeID` of the FormLabel's text, for the control's `aria-labelledby`. */
    formLabelId: `${id}-form-item-label`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

function FormItem({ className, ...props }: React.ComponentProps<typeof View>) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <View data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  )
}

// `htmlFor`: the label's text is the control's `aria-labelledby`, and pressing it focuses the control.
function FormLabel({ className, onPress, ...props }: LabelProps) {
  const { error, formLabelId, name } = useFormField()
  const { setFocus } = useFormContext()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      nativeID={formLabelId}
      onPress={(e) => {
        onPress?.(e)
        try {
          setFocus(name)
        } catch {
          // The control's ref has no focus().
        }
      }}
      // Label puts data-* props on its text, so the error color is also set here.
      className={cn("data-[error=true]:text-destructive", !!error && "text-destructive", className)}
      {...props}
    />
  )
}

type FormControlProps = { children?: React.ReactNode } & Record<string, unknown>

function FormControl({ ...props }: FormControlProps) {
  const { error, formItemId, formLabelId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot.Slot
      data-slot="form-control"
      nativeID={formItemId}
      aria-labelledby={formLabelId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  const { formDescriptionId } = useFormField()

  return (
    <Text
      data-slot="form-description"
      nativeID={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<typeof Text>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <Text
      data-slot="form-message"
      nativeID={formMessageId}
      role="alert"
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {body}
    </Text>
  )
}

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField }
