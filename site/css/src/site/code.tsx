import * as React from "react"
import { ScrollView, Text, View } from "@astrawind/css"

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
  plain: "text-gray-100",
  comment: "text-gray-500 italic",
  string: "text-sky-300",
  keyword: "text-pink-400",
  tag: "text-pink-400",
  attr: "text-indigo-300",
  punct: "text-gray-400",
  number: "text-amber-300",
}

/** A dark code block with a filename or language label, like tailwindcss.com's. */
export function CodeBlock({ code, lang, title, className }: { code: string; lang?: Lang; title?: string; className?: string }) {
  const text = code.replace(/^\n+|\s+$/g, "")
  const tokens = React.useMemo(() => tokenize(text, lang), [text, lang])
  return (
    <View className={`${className ?? "my-6"} overflow-hidden rounded-xl bg-gray-950 ring-1 ring-gray-950/10 dark:bg-white/5 dark:ring-white/10`}>
      {(title || lang) && (
        <View className="flex-row items-center border-b border-white/10 px-4 py-2">
          <Text className="font-mono text-xs font-medium text-gray-400">{title ?? lang}</Text>
        </View>
      )}
      <ScrollView horizontal contentContainerClassName="p-4">
        <Text selectable className="font-mono text-sm/6 text-gray-100">
          {tokens.map(([kind, t], i) => (
            <Text key={i} className={COLORS[kind]}>
              {t}
            </Text>
          ))}
        </Text>
      </ScrollView>
    </View>
  )
}

/** Inline `code`. */
export function Code({ children }: { children: React.ReactNode }) {
  return <Text className="font-mono text-[0.875em] font-medium text-gray-950 dark:text-white">{children}</Text>
}
