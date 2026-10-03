import * as React from "react"
import { Platform } from "react-native"
import { CheckIcon, CopyIcon } from "lucide-react-native"
import { ScrollView, Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Button } from "@astrawind/ui/button"
import { Icon } from "@astrawind/ui/icon"

export type Lang = "tsx" | "sh" | "css" | "json"

type Kind = "plain" | "comment" | "string" | "keyword" | "tag" | "attr" | "punct" | "number"
type Token = [kind: Kind, text: string]

const KEYWORDS = /^(import|from|export|default|function|return|const|let|type|interface|extends|as|new|await|async|if|else|true|false|null|undefined)$/

const STRING = String.raw`"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|` + "`(?:[^`\\\\]|\\\\.)*`"
const COMMENT = String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`

/** A small tokenizer for TSX, shell and CSS snippets: enough for docs, not a parser. */
function tokenize(code: string, lang: Lang | undefined): Token[] {
  const comment = lang === "sh" ? String.raw`#[^\n]*` : COMMENT
  const re = new RegExp(
    `(${comment})|(${STRING})|(<\\/?[A-Za-z][\\w.]*|\\/?>)|([A-Za-z_$][\\w$-]*)(?==)|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_$][\\w$-]*)|([{}()[\\];,.:=])`,
    "g"
  )
  const tokens: Token[] = []
  let last = 0
  for (const m of code.matchAll(re)) {
    if (m.index > last) tokens.push(["plain", code.slice(last, m.index)])
    const [text, com, str, tag, attr, num, word] = m
    if (com) tokens.push(["comment", text])
    else if (str) tokens.push(["string", text])
    else if (tag) tokens.push(["tag", text])
    else if (attr) tokens.push(["attr", text])
    else if (num) tokens.push(["number", text])
    else if (word) tokens.push([KEYWORDS.test(word) ? "keyword" : "plain", text])
    else tokens.push(["punct", text])
    last = m.index + text.length
  }
  if (last < code.length) tokens.push(["plain", code.slice(last)])
  return tokens
}

const COLORS: Record<Kind, string> = {
  plain: "text-foreground",
  comment: "text-muted-foreground italic",
  string: "text-emerald-700 dark:text-emerald-400",
  keyword: "text-violet-700 dark:text-violet-400",
  tag: "text-sky-700 dark:text-sky-400",
  attr: "text-amber-700 dark:text-amber-300",
  punct: "text-muted-foreground",
  number: "text-orange-700 dark:text-orange-300",
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  // Clipboard access is web-only here; native readers can select the text.
  if (Platform.OS !== "web") return null
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Copy code"
      className="size-7"
      onPress={() => {
        void globalThis.navigator?.clipboard?.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      <Icon as={copied ? CheckIcon : CopyIcon} className="size-3.5" />
    </Button>
  )
}

/** A code block with a title or language label and a copy button, like ui.shadcn.com's. */
export function CodeBlock({
  code,
  lang = "tsx",
  title,
  className,
  maxHeight,
}: {
  code: string
  lang?: Lang
  title?: string
  className?: string
  /** Scrolls vertically past this height. */
  maxHeight?: number
}) {
  const text = code.replace(/^\n+|\s+$/g, "")
  const tokens = React.useMemo(() => tokenize(text, lang), [text, lang])
  return (
    <View className={cn("overflow-hidden rounded-xl border bg-muted/40 dark:bg-muted/20", className)}>
      <View className="h-10 flex-row items-center justify-between border-b px-4">
        <Text className="font-mono text-xs text-muted-foreground">{title ?? lang}</Text>
        <CopyButton text={text} />
      </View>
      <ScrollView style={maxHeight ? { maxHeight } : undefined} nestedScrollEnabled>
        <ScrollView horizontal contentContainerClassName="p-4">
          <Text selectable className="font-mono text-[13px]/6 text-foreground">
            {tokens.map(([kind, t], i) => (
              <Text key={i} className={COLORS[kind]}>
                {t}
              </Text>
            ))}
          </Text>
        </ScrollView>
      </ScrollView>
    </View>
  )
}

/** Inline `code`. */
export function Code({ children }: { children: React.ReactNode }) {
  return <Text className="rounded-md bg-muted px-1 py-0.5 font-mono text-[0.875em]">{children}</Text>
}
