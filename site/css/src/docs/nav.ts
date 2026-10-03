/**
 * The docs navigation, in the same sections and order as tailwindcss.com/docs.
 *
 * Utility pages list the classes whose CSS sets one of the page's properties
 * (`props`, matched against Tailwind's generated CSS by scripts/gen-docs.ts);
 * `classes` narrows that to class names matching a pattern.
 */

export interface GuidePage {
  kind: "guide"
  slug: string
  title: string
  description: string
}

export interface UtilityPage {
  kind: "utility"
  slug: string
  title: string
  description: string
  /** CSS properties this page documents. Defaults to the slug. */
  props?: RegExp
  /** Only classes whose name matches. */
  classes?: RegExp
  /** More classes to list, e.g. arbitrary values Tailwind's class list doesn't include. */
  extra?: string[]
  /** Shown indented under the previous top-level page (filter → blur). */
  child?: boolean
}

export type DocPage = GuidePage | UtilityPage

export interface NavSection {
  title: string
  pages: DocPage[]
}

const guide = (slug: string, title: string, description: string): GuidePage => ({ kind: "guide", slug, title, description })

const util = (
  slug: string,
  description: string,
  options: Partial<Omit<UtilityPage, "kind" | "slug" | "description">> = {}
): UtilityPage => ({ kind: "utility", slug, title: options.title ?? slug, description, ...options })

export const sections: NavSection[] = [
  {
    title: "Getting started",
    pages: [
      guide("installation", "Installation", "Add AstraWind to an Expo or React Native app and style it with Tailwind classes."),
      guide("editor-setup", "Editor setup", "Autocomplete, linting and class sorting for className in your editor."),
      guide("compatibility", "Compatibility", "What AstraWind needs, and how web features map to React Native."),
    ],
  },
  {
    title: "Core concepts",
    pages: [
      guide(
        "styling-with-utility-classes",
        "Styling with utility classes",
        "Building complex components from a constrained set of primitive utilities, on native."
      ),
      guide(
        "hover-focus-and-other-states",
        "Hover, focus, and other states",
        "Using variants to style elements on press, hover, focus, and more."
      ),
      guide("responsive-design", "Responsive design", "Using responsive variants to build adaptive layouts for any screen size."),
      guide("dark-mode", "Dark mode", "Using variants to style your app in dark mode."),
      guide("theme", "Theme variables", "Using theme variables to define your app's design tokens."),
      guide("colors", "Colors", "Using and customizing the color palette in React Native apps."),
      guide("adding-custom-styles", "Adding custom styles", "Arbitrary values, style tokens, and adding className to any component."),
      guide("runtime", "Resolving classes at runtime", "How AstraWind turns className into native styles without a build step."),
      guide("hooks-and-components", "Hooks and components", "The React API: the provider, styled(), useTw() and friends."),
    ],
  },
  {
    title: "Base styles",
    pages: [guide("preflight", "Preflight", "The defaults AstraWind applies, and how text styles inherit.")],
  },
  {
    title: "Layout",
    pages: [
      util("aspect-ratio", "Utilities for controlling the aspect ratio of an element."),
      util("columns", "Utilities for controlling the number of columns within an element."),
      util("break-after", "Utilities for controlling how a column or page should break after an element."),
      util("break-before", "Utilities for controlling how a column or page should break before an element."),
      util("break-inside", "Utilities for controlling how a column or page should break within an element."),
      util("box-decoration-break", "Utilities for controlling how element fragments should be rendered across multiple lines, columns, or pages.", {
        props: /box-decoration-break$/,
      }),
      util("box-sizing", "Utilities for controlling how the browser should calculate an element's total size."),
      util("display", "Utilities for controlling the display box type of an element.", { extra: ["sr-only", "not-sr-only"] }),
      util("float", "Utilities for controlling the wrapping of content around an element."),
      util("clear", "Utilities for controlling the wrapping of content around an element."),
      util("isolation", "Utilities for controlling whether an element should explicitly create a new stacking context."),
      util("object-fit", "Utilities for controlling how a replaced element's content should be resized."),
      util("object-position", "Utilities for controlling how a replaced element's content should be positioned within its container."),
      util("overflow", "Utilities for controlling how an element handles content that is too large for the container.", {
        props: /^overflow(-[xy])?$/,
      }),
      util("overscroll-behavior", "Utilities for controlling how the browser behaves when reaching the boundary of a scrolling area.", {
        props: /^overscroll-behavior/,
      }),
      util("position", "Utilities for controlling how an element is positioned in the document."),
      util("top-right-bottom-left", "Utilities for controlling the placement of positioned elements.", {
        title: "top / right / bottom / left",
        props: /^(top|right|bottom|left|inset(-.+)?)$/,
      }),
      util("visibility", "Utilities for controlling the visibility of an element."),
      util("z-index", "Utilities for controlling the stack order of an element."),
    ],
  },
  {
    title: "Flexbox & Grid",
    pages: [
      util("flex-basis", "Utilities for controlling the initial size of flex items."),
      util("flex-direction", "Utilities for controlling the direction of flex items."),
      util("flex-wrap", "Utilities for controlling how flex items wrap."),
      util("flex", "Utilities for controlling how flex items both grow and shrink."),
      util("flex-grow", "Utilities for controlling how flex items grow."),
      util("flex-shrink", "Utilities for controlling how flex items shrink."),
      util("order", "Utilities for controlling the order of flex and grid items."),
      util("grid-template-columns", "Utilities for specifying the columns in a grid layout."),
      util("grid-column", "Utilities for controlling how elements are sized and placed across grid columns.", {
        props: /^grid-column(-start|-end)?$/,
      }),
      util("grid-template-rows", "Utilities for specifying the rows in a grid layout."),
      util("grid-row", "Utilities for controlling how elements are sized and placed across grid rows.", {
        props: /^grid-row(-start|-end)?$/,
      }),
      util("grid-auto-flow", "Utilities for controlling how elements in a grid are auto-placed."),
      util("grid-auto-columns", "Utilities for controlling the size of implicitly-created grid columns."),
      util("grid-auto-rows", "Utilities for controlling the size of implicitly-created grid rows."),
      util("gap", "Utilities for controlling gutters between grid and flexbox items.", { props: /^(gap|row-gap|column-gap)$/ }),
      util("justify-content", "Utilities for controlling how flex and grid items are positioned along a container's main axis."),
      util("justify-items", "Utilities for controlling how grid items are aligned along their inline axis."),
      util("justify-self", "Utilities for controlling how an individual grid item is aligned along its inline axis."),
      util("align-content", "Utilities for controlling how rows are positioned in multi-row flex and grid containers."),
      util("align-items", "Utilities for controlling how flex and grid items are positioned along a container's cross axis."),
      util("align-self", "Utilities for controlling how an individual flex or grid item is positioned along its container's cross axis."),
      util("place-content", "Utilities for controlling how content is justified and aligned at the same time."),
      util("place-items", "Utilities for controlling how items are justified and aligned at the same time."),
      util("place-self", "Utilities for controlling how an individual item is justified and aligned at the same time."),
    ],
  },
  {
    title: "Spacing",
    pages: [
      util("padding", "Utilities for controlling an element's padding.", { props: /^padding/ }),
      util("margin", "Utilities for controlling an element's margin.", { props: /^margin/ }),
    ],
  },
  {
    title: "Sizing",
    pages: [
      util("width", "Utilities for setting the width of an element."),
      util("min-width", "Utilities for setting the minimum width of an element."),
      util("max-width", "Utilities for setting the maximum width of an element."),
      util("height", "Utilities for setting the height of an element."),
      util("min-height", "Utilities for setting the minimum height of an element."),
      util("max-height", "Utilities for setting the maximum height of an element."),
      util("inline-size", "Utilities for setting the inline size of an element."),
      util("min-inline-size", "Utilities for setting the minimum inline size of an element."),
      util("max-inline-size", "Utilities for setting the maximum inline size of an element."),
      util("block-size", "Utilities for setting the block size of an element."),
      util("min-block-size", "Utilities for setting the minimum block size of an element."),
      util("max-block-size", "Utilities for setting the maximum block size of an element."),
    ],
  },
  {
    title: "Typography",
    pages: [
      util("font-family", "Utilities for controlling the font family of an element."),
      util("font-size", "Utilities for controlling the font size of an element."),
      util("font-smoothing", "Utilities for controlling the font smoothing of an element.", { props: /font-smoothing$/ }),
      util("font-style", "Utilities for controlling the style of text."),
      util("font-weight", "Utilities for controlling the font weight of an element."),
      util("font-stretch", "Utilities for selecting the width of a font face."),
      util("font-variant-numeric", "Utilities for controlling the variant of numbers.", {
        props: /^(font-variant-numeric|--tw-(ordinal|slashed-zero|numeric-figure|numeric-spacing|numeric-fraction))$/,
      }),
      util("font-feature-settings", "Utilities for controlling advanced typographic features.", {
        extra: ["font-features-['smcp']", "font-features-(--my-features)"],
      }),
      util("letter-spacing", "Utilities for controlling the tracking, or letter spacing, of an element.", { classes: /^-?tracking-/ }),
      util("line-clamp", "Utilities for clamping text to a specific number of lines.", { props: /line-clamp$/ }),
      util("line-height", "Utilities for controlling the leading, or line height, of an element.", { classes: /^leading-/ }),
      util("list-style-image", "Utilities for controlling the marker images for list items."),
      util("list-style-position", "Utilities for controlling the position of bullets and numbers in lists."),
      util("list-style-type", "Utilities for controlling the marker style of a list."),
      util("text-align", "Utilities for controlling the alignment of text."),
      util("color", "Utilities for controlling the text color of an element.", { classes: /^text-/ }),
      util("text-decoration-line", "Utilities for controlling the decoration of text."),
      util("text-decoration-color", "Utilities for controlling the color of text decorations."),
      util("text-decoration-style", "Utilities for controlling the style of text decorations."),
      util("text-decoration-thickness", "Utilities for controlling the thickness of text decorations."),
      util("text-underline-offset", "Utilities for controlling the offset of a text underline."),
      util("text-transform", "Utilities for controlling the capitalization of text."),
      util("text-overflow", "Utilities for controlling how the text of an element overflows."),
      util("text-wrap", "Utilities for controlling how text wraps within an element."),
      util("text-indent", "Utilities for controlling the amount of empty space shown before text in a block."),
      util("tab-size", "Utilities for controlling the width of tab characters."),
      util("vertical-align", "Utilities for controlling the vertical alignment of an inline or table-cell box."),
      util("white-space", "Utilities for controlling an element's white-space property."),
      util("word-break", "Utilities for controlling word breaks in an element."),
      util("overflow-wrap", "Utilities for controlling line breaks within words in an overflowing element."),
      util("hyphens", "Utilities for controlling how words should be hyphenated."),
      util("content", "Utilities for controlling the content of the before and after pseudo-elements.", {
        props: /^(content|--tw-content)$/,
      }),
    ],
  },
  {
    title: "Backgrounds",
    pages: [
      util("background-attachment", "Utilities for controlling how a background image behaves when scrolling."),
      util("background-clip", "Utilities for controlling the bounding box of an element's background."),
      util("background-color", "Utilities for controlling an element's background color."),
      util("background-image", "Utilities for controlling an element's background image.", {
        props: /^(background-image|--tw-gradient-(from|via|to))$/,
      }),
      util("background-origin", "Utilities for controlling how an element's background is positioned relative to borders, padding, and content."),
      util("background-position", "Utilities for controlling the position of an element's background image."),
      util("background-repeat", "Utilities for controlling the repetition of an element's background image."),
      util("background-size", "Utilities for controlling the background size of an element's background image."),
    ],
  },
  {
    title: "Borders",
    pages: [
      util("border-radius", "Utilities for controlling the border radius of an element.", { props: /radius$/ }),
      util("border-width", "Utilities for controlling the width of an element's borders.", { props: /^border(-[a-z]+)*-width$/ }),
      util("border-color", "Utilities for controlling the color of an element's borders.", { props: /^border(-[a-z]+)*-color$/ }),
      util("border-style", "Utilities for controlling the style of an element's borders.", { props: /^(border-style|--tw-border-style)$/ }),
      util("outline-width", "Utilities for controlling the width of an element's outline."),
      util("outline-color", "Utilities for controlling the color of an element's outline."),
      util("outline-style", "Utilities for controlling the style of an element's outline.", { props: /^(outline-style|--tw-outline-style)$/ }),
      util("outline-offset", "Utilities for controlling the offset of an element's outline."),
    ],
  },
  {
    title: "Effects",
    pages: [
      util("box-shadow", "Utilities for controlling the box shadow of an element.", {
        props: /^(box-shadow|--tw-(inset-)?(shadow|ring)-color|--tw-ring-inset)$/,
      }),
      util("text-shadow", "Utilities for controlling the shadow of a text element.", { props: /^(text-shadow|--tw-text-shadow-color)$/ }),
      util("opacity", "Utilities for controlling the opacity of an element."),
      util("mix-blend-mode", "Utilities for controlling how an element should blend with the background."),
      util("background-blend-mode", "Utilities for controlling how an element's background image should blend with its background color."),
      util("mask-clip", "Utilities for controlling the bounding box of an element's mask."),
      util("mask-composite", "Utilities for controlling how multiple masks are combined together."),
      util("mask-image", "Utilities for controlling an element's mask image.", { props: /^(mask-image|--tw-mask-.+)$/ }),
      util("mask-mode", "Utilities for controlling an element's mask mode."),
      util("mask-origin", "Utilities for controlling how an element's mask image is positioned relative to borders, padding, and content."),
      util("mask-position", "Utilities for controlling the position of an element's mask image."),
      util("mask-repeat", "Utilities for controlling the repetition of an element's mask image."),
      util("mask-size", "Utilities for controlling the size of an element's mask image."),
      util("mask-type", "Utilities for controlling how an SVG mask is interpreted."),
    ],
  },
  {
    title: "Filters",
    pages: [
      util("filter", "Utilities for applying filters to an element.", {
        classes: /^filter-/,
        extra: ["filter-none", "filter-(--my-filter)", "filter-[url('#filter')]"],
      }),
      util("filter-blur", "Utilities for applying blur filters to an element.", { title: "blur", props: /^--tw-blur$/, child: true }),
      util("filter-brightness", "Utilities for applying brightness filters to an element.", { title: "brightness", props: /^--tw-brightness$/, child: true }),
      util("filter-contrast", "Utilities for applying contrast filters to an element.", { title: "contrast", props: /^--tw-contrast$/, child: true }),
      util("filter-drop-shadow", "Utilities for applying drop-shadow filters to an element.", {
        title: "drop-shadow",
        props: /^--tw-drop-shadow(-color)?$/,
        child: true,
      }),
      util("filter-grayscale", "Utilities for applying grayscale filters to an element.", { title: "grayscale", props: /^--tw-grayscale$/, child: true }),
      util("filter-hue-rotate", "Utilities for applying hue-rotate filters to an element.", { title: "hue-rotate", props: /^--tw-hue-rotate$/, child: true }),
      util("filter-invert", "Utilities for applying invert filters to an element.", { title: "invert", props: /^--tw-invert$/, child: true }),
      util("filter-saturate", "Utilities for applying saturation filters to an element.", { title: "saturate", props: /^--tw-saturate$/, child: true }),
      util("filter-sepia", "Utilities for applying sepia filters to an element.", { title: "sepia", props: /^--tw-sepia$/, child: true }),
      util("backdrop-filter", "Utilities for applying backdrop filters to an element.", {
        classes: /^backdrop-filter-/,
        props: /backdrop-filter$/,
        extra: ["backdrop-filter-none", "backdrop-filter-(--my-filter)", "backdrop-filter-[url('#filter')]"],
      }),
      util("backdrop-filter-blur", "Utilities for applying backdrop blur filters to an element.", {
        title: "blur",
        props: /^--tw-backdrop-blur$/,
        child: true,
      }),
      util("backdrop-filter-brightness", "Utilities for applying backdrop brightness filters to an element.", {
        title: "brightness",
        props: /^--tw-backdrop-brightness$/,
        child: true,
      }),
      util("backdrop-filter-contrast", "Utilities for applying backdrop contrast filters to an element.", {
        title: "contrast",
        props: /^--tw-backdrop-contrast$/,
        child: true,
      }),
      util("backdrop-filter-grayscale", "Utilities for applying backdrop grayscale filters to an element.", {
        title: "grayscale",
        props: /^--tw-backdrop-grayscale$/,
        child: true,
      }),
      util("backdrop-filter-hue-rotate", "Utilities for applying backdrop hue-rotate filters to an element.", {
        title: "hue-rotate",
        props: /^--tw-backdrop-hue-rotate$/,
        child: true,
      }),
      util("backdrop-filter-invert", "Utilities for applying backdrop invert filters to an element.", {
        title: "invert",
        props: /^--tw-backdrop-invert$/,
        child: true,
      }),
      util("backdrop-filter-opacity", "Utilities for applying backdrop opacity filters to an element.", {
        title: "opacity",
        props: /^--tw-backdrop-opacity$/,
        child: true,
      }),
      util("backdrop-filter-saturate", "Utilities for applying backdrop saturation filters to an element.", {
        title: "saturate",
        props: /^--tw-backdrop-saturate$/,
        child: true,
      }),
      util("backdrop-filter-sepia", "Utilities for applying backdrop sepia filters to an element.", {
        title: "sepia",
        props: /^--tw-backdrop-sepia$/,
        child: true,
      }),
    ],
  },
  {
    title: "Tables",
    pages: [
      util("border-collapse", "Utilities for controlling whether table borders should collapse or be separated."),
      util("border-spacing", "Utilities for controlling the spacing between table borders.", { props: /^(border-spacing|--tw-border-spacing-[xy])$/ }),
      util("table-layout", "Utilities for controlling the table layout algorithm."),
      util("caption-side", "Utilities for controlling the alignment of a caption element inside of a table."),
    ],
  },
  {
    title: "Transitions & Animation",
    pages: [
      util("transition-property", "Utilities for controlling which CSS properties transition."),
      util("transition-behavior", "Utilities to control the behavior of CSS transitions."),
      util("transition-duration", "Utilities for controlling the duration of CSS transitions.", { classes: /^duration-/ }),
      util("transition-timing-function", "Utilities for controlling the easing of CSS transitions.", { classes: /^ease-/ }),
      util("transition-delay", "Utilities for controlling the delay of CSS transitions."),
      util("animation", "Utilities for animating elements with CSS animations."),
    ],
  },
  {
    title: "Transforms",
    pages: [
      util("backface-visibility", "Utilities for controlling if an element's backface is visible."),
      util("perspective", "Utilities for controlling an element's perspective when placed in 3D space."),
      util("perspective-origin", "Utilities for controlling an element's perspective origin when placed in 3D space."),
      util("rotate", "Utilities for rotating elements.", { props: /^(rotate|--tw-rotate-[xyz])$/ }),
      util("scale", "Utilities for scaling elements.", { props: /^(scale|--tw-scale-[xyz])$/ }),
      util("skew", "Utilities for skewing elements with transform.", { props: /^--tw-skew-[xy]$/ }),
      util("transform", "Utilities for transforming elements.", { classes: /^transform/ }),
      util("transform-origin", "Utilities for specifying the origin for an element's transformations."),
      util("transform-style", "Utilities for controlling if an elements children are placed in 3D space."),
      util("translate", "Utilities for translating elements.", { props: /^(translate|--tw-translate-[xyz])$/ }),
      util("zoom", "Utilities for scaling an element and its layout."),
    ],
  },
  {
    title: "Interactivity",
    pages: [
      util("accent-color", "Utilities for controlling the accented color of a form control."),
      util("appearance", "Utilities for suppressing native form control styling."),
      util("caret-color", "Utilities for controlling the color of the text input cursor."),
      util("color-scheme", "Utilities for controlling the color scheme of an element."),
      util("cursor", "Utilities for controlling the cursor style when hovering over an element."),
      util("field-sizing", "Utilities for controlling the sizing of form controls."),
      util("pointer-events", "Utilities for controlling whether an element responds to pointer events."),
      util("resize", "Utilities for controlling how an element can be resized."),
      util("scroll-behavior", "Utilities for controlling the scroll behavior of an element."),
      util("scrollbar-color", "Utilities for controlling the color of an element's scrollbar."),
      util("scrollbar-width", "Utilities for controlling the width of an element's scrollbar."),
      util("scrollbar-gutter", "Utilities for reserving space for an element's scrollbar."),
      util("scroll-margin", "Utilities for controlling the scroll offset around items in a snap container.", { props: /^scroll-margin/ }),
      util("scroll-padding", "Utilities for controlling an element's scroll offset within a snap container.", { props: /^scroll-padding/ }),
      util("scroll-snap-align", "Utilities for controlling the scroll snap alignment of an element."),
      util("scroll-snap-stop", "Utilities for controlling whether you can skip past possible snap positions."),
      util("scroll-snap-type", "Utilities for controlling how strictly snap points are enforced in a snap container.", {
        props: /^(scroll-snap-type|--tw-scroll-snap-strictness)$/,
      }),
      util("touch-action", "Utilities for controlling how an element can be scrolled and zoomed on touchscreens.", {
        props: /^(touch-action|--tw-pan-[xy]|--tw-pinch-zoom)$/,
      }),
      util("user-select", "Utilities for controlling whether the user can select text in an element.", { props: /user-select$/ }),
      util("will-change", "Utilities for optimizing upcoming animations of elements that are expected to change."),
    ],
  },
  {
    title: "SVG",
    pages: [
      util("fill", "Utilities for styling the fill of SVG elements."),
      util("stroke", "Utilities for styling the stroke of SVG elements."),
      util("stroke-width", "Utilities for styling the stroke width of SVG elements."),
    ],
  },
  {
    title: "Accessibility",
    pages: [util("forced-color-adjust", "Utilities for opting in and out of forced colors.")],
  },
]

export const pages: DocPage[] = sections.flatMap((s) => s.pages)

export const sectionOf = (slug: string) => sections.find((s) => s.pages.some((p) => p.slug === slug))

export const pageBySlug = (slug: string) => pages.find((p) => p.slug === slug)

export const utilityPages = pages.filter((p): p is UtilityPage => p.kind === "utility")
