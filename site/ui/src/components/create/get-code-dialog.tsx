import * as React from "react"
import { ScrollView, Text } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@astrawind/ui/dialog"
import { CodeBlock } from "@/components/code-block"
import { generateCode, INSTALL_COMMAND, type CreateOptions } from "@/lib/create"

/** "Get Code": the install command and the `ThemeProvider` for the chosen options. */
export function GetCodeDialog({ options, className }: { options: CreateOptions; className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={className}>Get Code</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90%] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Get Code</DialogTitle>
          <DialogDescription>Install the packages, then wrap your app in this ThemeProvider.</DialogDescription>
        </DialogHeader>
        <ScrollView className="min-h-0 shrink" contentContainerClassName="gap-4">
          <CodeBlock code={INSTALL_COMMAND} lang="sh" title="Terminal" />
          <CodeBlock code={generateCode(options)} title="App.tsx" maxHeight={420} />
          <Text className="text-sm text-muted-foreground">
            Light and dark mode follow the system; set defaultTheme or forcedTheme to change that.
          </Text>
        </ScrollView>
      </DialogContent>
    </Dialog>
  )
}
