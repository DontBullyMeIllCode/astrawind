import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { H2, P } from "../prose"

export default function EditorSetup() {
  return (
    <>
      <H2 first>IntelliSense for VS Code</H2>
      <P>
        The official Tailwind CSS IntelliSense extension gives you autocomplete, linting and hover previews. It needs a
        Tailwind stylesheet to find your project; AstraWind doesn't compile one, so add a small file that only your editor
        reads:
      </P>
      <CodeBlock lang="css" title="tailwind.css" code={`@import "tailwindcss";`} />
      <CodeBlock
        lang="json"
        title=".vscode/settings.json"
        code={`
{
  "tailwindCSS.experimental.configFile": "tailwind.css",
  "tailwindCSS.classAttributes": ["className", "contentContainerClassName", "columnWrapperClassName"]
}
`}
      />
      <P>
        Add your own className props to <Code>classAttributes</Code> too, such as the ones you map with{" "}
        <Code>classNameProps</Code> in <Code>styled()</Code>.
      </P>

      <H2>Automatic class sorting with Prettier</H2>
      <P>
        prettier-plugin-tailwindcss sorts classes in Tailwind's recommended order. It works with AstraWind as it is, since
        AstraWind resolves classes the same way regardless of their order:
      </P>
      <CodeBlock lang="sh" title="Terminal" code={`npm install -D prettier prettier-plugin-tailwindcss`} />
      <CodeBlock
        lang="json"
        title=".prettierrc"
        code={`
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./tailwind.css"
}
`}
      />
    </>
  )
}
