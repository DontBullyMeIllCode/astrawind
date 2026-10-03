import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@astrawind/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@astrawind/ui/form"
import { Input } from "@astrawind/ui/input"
import { View } from "@astrawind/css"

type FormValues = { username: string }

export default function FormExample() {
  const form = useForm<FormValues>({ defaultValues: { username: "" } })
  const onSubmit = (values: FormValues) => console.log(values)

  return (
    <Form {...form}>
      <View className="gap-8">
        <FormField
          control={form.control}
          name="username"
          rules={{ validate: (value) => value.length >= 2 || "Username must be at least 2 characters." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="shadcn"
                  ref={field.ref}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button onPress={form.handleSubmit(onSubmit)}>Submit</Button>
      </View>
    </Form>
  )
}
