import { ArrowRightIcon, ChevronUpIcon, SearchIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@astrawind/ui/alert-dialog"
import { Badge } from "@astrawind/ui/badge"
import { Button } from "@astrawind/ui/button"
import { ButtonGroup } from "@astrawind/ui/button-group"
import { Card, CardContent } from "@astrawind/ui/card"
import { Checkbox } from "@astrawind/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@astrawind/ui/dropdown-menu"
import { Field, FieldGroup } from "@astrawind/ui/field"
import { Icon } from "@astrawind/ui/icon"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@astrawind/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@astrawind/ui/radio-group"
import { Switch } from "@astrawind/ui/switch"
import { Textarea } from "@astrawind/ui/textarea"

// Upstream's `hidden 4xl:flex` elements (an Outline badge, a second checkbox and a second switch)
// are left out: shadcn defines no `4xl` breakpoint, so they never show. The `style-sera:` labels
// are its other style's; this one shows "Alert Dialog" from md and "Button Group".
export function UIElements() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-6">
        <View className="flex gap-2">
          <Button>
            Button <Icon as={ArrowRightIcon} data-icon="inline-end" />
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </View>
        <FieldGroup>
          <Field>
            <InputGroup>
              <InputGroupInput placeholder="Name" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>
                  <Icon as={SearchIcon} />
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field className="flex-1">
            <Textarea placeholder="Message" className="resize-none" />
          </Field>
        </FieldGroup>
        <View className="flex items-center gap-2">
          <View className="flex gap-2">
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </View>
          <RadioGroup defaultValue="apple" className="ml-auto flex w-fit gap-3" aria-label="Fruit preference">
            <RadioGroupItem value="apple" aria-label="Apple" />
            <RadioGroupItem value="banana" aria-label="Banana" />
          </RadioGroup>
          <View className="flex gap-3">
            <Checkbox defaultChecked aria-label="Enable email alerts" />
          </View>
          <Switch defaultChecked className="flex" aria-label="Enable compact notifications" />
        </View>
        <View className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Text className="hidden md:flex">Alert Dialog</Text>
                <Text className="flex md:hidden">Dialog</Text>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
                <AlertDialogDescription>
                  Do you want to allow the USB accessory to connect to this device and your data?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
                <AlertDialogAction>Allow</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ButtonGroup className="ml-auto">
            <Button variant="outline">Button Group</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* ButtonGroup joins its direct children; the trigger's Button is one level down. */}
                <Button variant="outline" size="icon" className="rounded-l-none border-l-0" aria-label="Open quick actions">
                  <Icon as={ChevronUpIcon} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Mute Conversation</DropdownMenuItem>
                  <DropdownMenuItem>Mark as Read</DropdownMenuItem>
                  <DropdownMenuItem>Block User</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive">Delete Conversation</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </View>
      </CardContent>
    </Card>
  )
}
