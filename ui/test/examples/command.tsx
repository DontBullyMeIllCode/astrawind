import * as React from "react"
import { CalculatorIcon, CalendarIcon, CreditCardIcon, SettingsIcon, SmileIcon, UserIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@astrawind/ui/command"
import { Icon } from "@astrawind/ui/icon"

function Items() {
  return (
    <>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Suggestions">
        <CommandItem>
          <Icon as={CalendarIcon} />
          <Text>Calendar</Text>
        </CommandItem>
        <CommandItem>
          <Icon as={SmileIcon} />
          <Text>Search Emoji</Text>
        </CommandItem>
        <CommandItem disabled>
          <Icon as={CalculatorIcon} />
          <Text>Calculator</Text>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Settings">
        <CommandItem keywords={["account"]}>
          <Icon as={UserIcon} />
          <Text>Profile</Text>
          <CommandShortcut>⌘P</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <Icon as={CreditCardIcon} />
          <Text>Billing</Text>
          <CommandShortcut>⌘B</CommandShortcut>
        </CommandItem>
        <CommandItem value="settings" onSelect={() => {}}>
          <Icon as={SettingsIcon} />
          <Text>Settings</Text>
          <CommandShortcut>⌘S</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </>
  )
}

export default function CommandExample() {
  const [open, setOpen] = React.useState(false)
  return (
    <View className="w-full gap-6">
      <Command className="rounded-lg border shadow-md md:min-w-[450px]" defaultValue="Calendar">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <Items />
        </CommandList>
      </Command>
      <Button variant="outline" onPress={() => setOpen(true)}>
        Open command palette
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <Items />
        </CommandList>
      </CommandDialog>
    </View>
  )
}
