import { ChevronRightIcon, CircleAlertIcon, LockIcon } from "lucide-react-native"
import { Pressable, Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Field, FieldGroup, FieldLabel } from "@astrawind/ui/field"
import { Icon } from "@astrawind/ui/icon"
import { Input } from "@astrawind/ui/input"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@astrawind/ui/item"

export function AccountAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Access</CardTitle>
        <CardDescription>Update your credentials or re-authenticate.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel nativeID="email-address">Email Address</FieldLabel>
            <Input
              aria-labelledby="email-address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="artist@studio.inc"
            />
          </Field>
          <Field>
            <View className="flex items-center justify-between">
              <FieldLabel nativeID="current-password">Current Password</FieldLabel>
              <Pressable role="link" className="group">
                <Text className="text-xs font-medium tracking-wider text-muted-foreground uppercase group-hover:text-foreground group-active:text-foreground">
                  Forgot?
                </Text>
              </Pressable>
            </View>
            <Input aria-labelledby="current-password" secureTextEntry placeholder="••••••••••••••••••••••••" />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button className="w-full">
          <Icon as={LockIcon} />
          Update Security
        </Button>
        <Item variant="muted" role="link" onPress={() => {}}>
          <ItemMedia variant="icon">
            <Icon as={CircleAlertIcon} className="text-destructive" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Danger Zone</ItemTitle>
            <ItemDescription className="line-clamp-1">Archive account and remove catalog</ItemDescription>
          </ItemContent>
          <Icon as={ChevronRightIcon} className="size-4" />
        </Item>
      </CardFooter>
    </Card>
  )
}
