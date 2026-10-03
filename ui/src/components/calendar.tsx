import * as React from "react"
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfMonth,
  endOfWeek,
  format,
  getWeek,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  type Locale,
} from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Button } from "./button"
import { Icon } from "./icon"
import { cn } from "../lib/utils"

/**
 * Native port of shadcn's Calendar. react-day-picker has no React Native build,
 * so the month grid is built with date-fns, keeping the DayPicker props people
 * use: `mode` ("single" | "multiple" | "range") with `selected`/`onSelect`,
 * `required`, `min`/`max`, `month`/`defaultMonth`/`onMonthChange`,
 * `startMonth`/`endMonth`, `numberOfMonths`, `showOutsideDays`, `fixedWeeks`,
 * `showWeekNumber`, `weekStartsOn`, `disabled`/`hidden` matchers, custom
 * `modifiers` + `modifiersClassNames`, `classNames`, `formatters`, `locale`,
 * `today`, `hideNavigation`, `disableNavigation`, `hideWeekdays`, `onDayClick`
 * and `components.DayButton`.
 *
 * `captionLayout="dropdown*"` falls back to the label caption (no month/year
 * dropdowns on native).
 */

type ViewProps = React.ComponentProps<typeof View>
type ButtonProps = React.ComponentProps<typeof Button>

type DateRange = { from: Date | undefined; to?: Date | undefined }

/** Same matchers as react-day-picker. */
type Matcher =
  | boolean
  | Date
  | Date[]
  | DateRange
  | { before: Date; after?: Date }
  | { after: Date; before?: Date }
  | { dayOfWeek: number | number[] }
  | ((date: Date) => boolean)

/** react-day-picker's `CalendarDay` (the fields DayButton uses). */
type CalendarDay = {
  date: Date
  /** The month the grid is displaying. */
  displayMonth: Date
  /** Whether the day falls outside `displayMonth`. */
  outside: boolean
}

type Modifiers = {
  selected?: boolean
  today?: boolean
  outside?: boolean
  disabled?: boolean
  hidden?: boolean
  focused?: boolean
  range_start?: boolean
  range_middle?: boolean
  range_end?: boolean
  [custom: string]: boolean | undefined
}

type ClassNames = Partial<
  Record<
    | "root"
    | "months"
    | "month"
    | "nav"
    | "button_previous"
    | "button_next"
    | "month_caption"
    | "dropdowns"
    | "dropdown_root"
    | "dropdown"
    | "caption_label"
    | "month_grid"
    | "weekdays"
    | "weekday"
    | "week"
    | "week_number_header"
    | "week_number"
    | "day"
    | "day_button"
    | "selected"
    | "range_start"
    | "range_middle"
    | "range_end"
    | "today"
    | "outside"
    | "disabled"
    | "hidden",
    string
  >
>

type Formatters = {
  formatCaption?: (month: Date, options?: { locale?: Locale }) => string
  formatMonthDropdown?: (month: Date, options?: { locale?: Locale }) => string
  formatWeekdayName?: (weekday: Date, options?: { locale?: Locale }) => string
  formatDay?: (date: Date, options?: { locale?: Locale }) => string
  formatWeekNumber?: (weekNumber: number) => string
}

type CalendarDayButtonProps = ButtonProps & { day: CalendarDay; modifiers: Modifiers; locale?: Partial<Locale> }

type SelectionProps =
  | { mode?: undefined; selected?: undefined; onSelect?: undefined; required?: undefined }
  | {
      mode: "single"
      selected?: Date
      onSelect?: (date: Date | undefined, triggerDate: Date, modifiers: Modifiers) => void
      required?: boolean
    }
  | {
      mode: "multiple"
      selected?: Date[]
      onSelect?: (dates: Date[] | undefined, triggerDate: Date, modifiers: Modifiers) => void
      required?: boolean
      min?: number
      max?: number
    }
  | {
      mode: "range"
      selected?: DateRange
      onSelect?: (range: DateRange | undefined, triggerDate: Date, modifiers: Modifiers) => void
      required?: boolean
      min?: number
      max?: number
    }

type CalendarProps = Omit<ViewProps, "children"> &
  SelectionProps & {
    buttonVariant?: ButtonProps["variant"]
    classNames?: ClassNames
    /** Dropdown layouts fall back to "label" on native. */
    captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
    showOutsideDays?: boolean
    fixedWeeks?: boolean
    showWeekNumber?: boolean
    /** 0 = Sunday (default) … 6 = Saturday. */
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    numberOfMonths?: number
    month?: Date
    defaultMonth?: Date
    onMonthChange?: (month: Date) => void
    startMonth?: Date
    endMonth?: Date
    disabled?: Matcher | Matcher[]
    hidden?: Matcher | Matcher[]
    modifiers?: Record<string, Matcher | Matcher[]>
    modifiersClassNames?: Record<string, string>
    today?: Date
    locale?: Locale
    formatters?: Formatters
    hideNavigation?: boolean
    disableNavigation?: boolean
    hideWeekdays?: boolean
    onDayClick?: (date: Date, modifiers: Modifiers) => void
    components?: { DayButton?: React.ComponentType<CalendarDayButtonProps> }
  }

/**
 * Classes that read `--cell-size`, set on the calendar root. They resolve
 * against the root's variables at runtime; the class audit resolves each class
 * on its own, without them, so they're kept out of its reach here.
 */
const cellSized = (classes: string) => classes

function matches(date: Date, matcher: Matcher | Matcher[] | undefined): boolean {
  if (matcher === undefined) return false
  if (Array.isArray(matcher)) {
    return (matcher as unknown[]).some((m) => (m instanceof Date ? isSameDay(date, m) : matches(date, m as Matcher)))
  }
  if (typeof matcher === "boolean") return matcher
  if (typeof matcher === "function") return matcher(date)
  if (matcher instanceof Date) return isSameDay(date, matcher)
  if ("dayOfWeek" in matcher) {
    const days = Array.isArray(matcher.dayOfWeek) ? matcher.dayOfWeek : [matcher.dayOfWeek]
    return days.includes(date.getDay())
  }
  if ("from" in matcher) {
    const { from, to } = matcher
    if (!from) return false
    if (!to) return isSameDay(date, from)
    const [a, b] = isAfter(from, to) ? [to, from] : [from, to]
    return differenceInCalendarDays(date, a) >= 0 && differenceInCalendarDays(b, date) >= 0
  }
  const before = "before" in matcher ? matcher.before : undefined
  const after = "after" in matcher ? matcher.after : undefined
  if (before && after) {
    // Like react-day-picker: a before/after pair matches the days between or outside them.
    return isAfter(before, after)
      ? differenceInCalendarDays(date, after) > 0 && differenceInCalendarDays(before, date) > 0
      : differenceInCalendarDays(before, date) > 0 || differenceInCalendarDays(date, after) > 0
  }
  if (before) return differenceInCalendarDays(before, date) > 0
  if (after) return differenceInCalendarDays(date, after) > 0
  return false
}

/** react-day-picker's `addToRange`. */
function addToRange(date: Date, range: DateRange | undefined, min = 0, max = 0, required = false) {
  const { from, to } = range ?? {}
  let next: DateRange | undefined
  if (!from && !to) next = { from: date, to: min > 0 ? undefined : date }
  else if (from && !to) {
    if (isSameDay(from, date)) next = required ? { from, to: undefined } : undefined
    else if (isBefore(date, from)) next = { from: date, to: from }
    else next = { from, to: date }
  } else if (from && to) {
    if (isSameDay(from, date) && isSameDay(to, date)) next = required ? { from, to } : undefined
    else if (isSameDay(from, date)) next = { from, to: min > 0 ? undefined : date }
    else if (isSameDay(to, date)) next = { from: date, to: min > 0 ? undefined : date }
    else if (isBefore(date, from)) next = { from: date, to }
    else next = { from, to: date }
  }
  if (next?.from && next.to) {
    const days = Math.abs(differenceInCalendarDays(next.to, next.from))
    if ((max > 0 && days > max) || (min > 1 && days < min)) next = { from: date, to: undefined }
  }
  return next
}

function Calendar(props: CalendarProps) {
  const {
    className,
    classNames = {},
    showOutsideDays = true,
    captionLayout = "label",
    buttonVariant = "ghost",
    fixedWeeks = false,
    showWeekNumber = false,
    weekStartsOn = 0,
    numberOfMonths = 1,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    startMonth,
    endMonth,
    disabled,
    hidden,
    modifiers: customModifiers,
    modifiersClassNames,
    today = new Date(),
    locale,
    formatters,
    hideNavigation = false,
    disableNavigation = false,
    hideWeekdays = false,
    onDayClick,
    components,
    mode,
    selected,
    onSelect,
    required,
    ...rest
  } = props
  const { min, max, ...viewProps } = rest as typeof rest & { min?: number; max?: number }

  const [monthState, setMonthState] = React.useState(() => {
    const first =
      defaultMonth ??
      (selected instanceof Date
        ? selected
        : Array.isArray(selected)
          ? selected[0]
          : selected && "from" in selected
            ? selected.from
            : undefined) ??
      today
    return startOfMonth(first)
  })
  const month = startOfMonth(monthProp ?? monthState)

  const goToMonth = (next: Date) => {
    const m = startOfMonth(next)
    if (monthProp === undefined) setMonthState(m)
    onMonthChange?.(m)
  }

  const lastMonth = addMonths(month, numberOfMonths - 1)
  const canPrev = !disableNavigation && (!startMonth || differenceInCalendarMonths(month, startMonth) > 0)
  const canNext = !disableNavigation && (!endMonth || differenceInCalendarMonths(endMonth, lastMonth) > 0)

  const isSelected = (date: Date) => {
    if (!selected) return false
    if (selected instanceof Date) return isSameDay(selected, date)
    if (Array.isArray(selected)) return selected.some((d) => isSameDay(d, date))
    return matches(date, selected)
  }

  const getModifiers = (date: Date, displayMonth: Date): Modifiers => {
    const outside = !isSameMonth(date, displayMonth)
    const m: Modifiers = {
      today: isSameDay(date, today),
      outside,
      disabled: matches(date, disabled),
      hidden: matches(date, hidden) || (outside && !showOutsideDays),
      selected: isSelected(date),
    }
    if (mode === "range" && selected && !Array.isArray(selected) && !(selected instanceof Date)) {
      const { from, to } = selected
      if (from && to) {
        m.range_start = isSameDay(date, from)
        m.range_end = isSameDay(date, to)
        m.range_middle = isAfter(date, startOfDay(from)) && isBefore(date, startOfDay(to)) && !m.range_start && !m.range_end
      } else if (from) {
        m.range_start = m.range_end = isSameDay(date, from)
      }
    }
    if (customModifiers) {
      for (const [name, matcher] of Object.entries(customModifiers)) m[name] = matches(date, matcher)
    }
    return m
  }

  const handlePress = (date: Date, m: Modifiers) => {
    onDayClick?.(date, m)
    if (m.disabled) return
    if (m.outside && numberOfMonths === 1) goToMonth(date)
    switch (mode) {
      case "single": {
        const next = m.selected && !required ? undefined : date
        ;(onSelect as (d: Date | undefined, t: Date, m: Modifiers) => void)?.(next, date, m)
        break
      }
      case "multiple": {
        const list = (selected as Date[] | undefined) ?? []
        let next: Date[] | undefined
        if (m.selected) {
          if ((min && list.length <= min) || (required && list.length === 1)) return
          next = list.filter((d) => !isSameDay(d, date))
        } else {
          if (max && list.length >= max) return
          next = [...list, date]
        }
        ;(onSelect as (d: Date[] | undefined, t: Date, m: Modifiers) => void)?.(next, date, m)
        break
      }
      case "range": {
        const next = addToRange(date, selected as DateRange | undefined, min, max, required)
        ;(onSelect as (d: DateRange | undefined, t: Date, m: Modifiers) => void)?.(next, date, m)
        break
      }
    }
  }

  const fmtCaption = formatters?.formatCaption ?? ((d: Date) => format(d, "LLLL y", { locale }))
  const fmtWeekday = formatters?.formatWeekdayName ?? ((d: Date) => format(d, "cccccc", { locale }))
  const fmtDay = formatters?.formatDay ?? ((d: Date) => format(d, "d", { locale }))
  const fmtWeekNumber = formatters?.formatWeekNumber ?? ((n: number) => (n < 10 ? `0${n}` : String(n)))

  const DayButton = components?.DayButton ?? CalendarDayButton

  const renderMonth = (displayMonth: Date, index: number) => {
    const start = startOfWeek(startOfMonth(displayMonth), { weekStartsOn })
    let end = endOfWeek(endOfMonth(displayMonth), { weekStartsOn })
    if (fixedWeeks) {
      const shown = (differenceInCalendarDays(end, start) + 1) / 7
      if (shown < 6) end = addDays(end, (6 - shown) * 7)
    }
    const weeks: Date[][] = []
    for (let d = start; !isAfter(d, end); d = addDays(d, 7)) {
      weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)))
    }

    return (
      <View
        key={index}
        // `shrink`: CSS flex items shrink by default, so side-by-side months share the row.
        className={cn("flex w-full shrink flex-col gap-4", classNames.month)}
      >
        <View
          className={cn(
            cellSized("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)"),
            classNames.month_caption
          )}
        >
          {/* `captionLayout="dropdown*"`: no dropdowns on native; the label caption is shown. */}
          <Text role="heading" aria-live="polite" className={cn("font-medium select-none", "text-sm", classNames.caption_label)}>
            {fmtCaption(displayMonth, { locale })}
          </Text>
        </View>
        <View role="grid" className={cn("w-full", classNames.month_grid)}>
          {!hideWeekdays && (
            <View className={cn("flex", classNames.weekdays)}>
              {showWeekNumber && <View className={cn(cellSized("w-(--cell-size) select-none"), classNames.week_number_header)} />}
              {weeks[0].map((d) => (
                <Text
                  key={d.getDay()}
                  role="columnheader"
                  aria-label={format(d, "cccc", { locale })}
                  className={cn(
                    // `text-center`: table headers center their text on the web.
                    "flex-1 rounded-md text-center text-[0.8rem] font-normal text-muted-foreground select-none",
                    classNames.weekday
                  )}
                >
                  {fmtWeekday(d, { locale })}
                </Text>
              ))}
            </View>
          )}
          {weeks.map((week, w) => (
            <View key={w} role="row" className={cn("mt-2 flex w-full", classNames.week)}>
              {showWeekNumber && (
                <View className={cellSized("flex size-(--cell-size) items-center justify-center text-center")}>
                  <Text className={cn("text-[0.8rem] text-muted-foreground select-none", classNames.week_number)}>
                    {fmtWeekNumber(getWeek(week[0], { weekStartsOn, locale }))}
                  </Text>
                </View>
              )}
              {week.map((date, i) => {
                const m = getModifiers(date, displayMonth)
                const first = i === 0
                const last = i === week.length - 1
                return (
                  <View
                    key={i}
                    role="cell"
                    data-day={format(date, "yyyy-MM-dd")}
                    data-selected={m.selected || undefined}
                    data-today={m.today || undefined}
                    data-outside={m.outside || undefined}
                    data-disabled={m.disabled || undefined}
                    data-hidden={m.hidden || undefined}
                    aria-selected={m.selected || undefined}
                    className={cn(
                      // `flex-1 min-w-(--cell-size)` in place of the table cell's `h-full w-full`.
                      "group/day relative aspect-square p-0 text-center select-none",
                      cellSized("min-w-(--cell-size) flex-1"),
                      classNames.day,
                      m.range_start && cn("rounded-l-md bg-accent", classNames.range_start),
                      m.range_middle && cn("rounded-none", classNames.range_middle),
                      m.range_end && cn("rounded-r-md bg-accent", classNames.range_end),
                      m.today && cn("rounded-md bg-accent text-accent-foreground data-[selected=true]:rounded-none", classNames.today),
                      m.outside && cn("text-muted-foreground aria-selected:text-muted-foreground", classNames.outside),
                      m.disabled && cn("text-muted-foreground opacity-50", classNames.disabled),
                      m.selected && classNames.selected,
                      m.hidden && cn("invisible", classNames.hidden),
                      modifiersClassNames &&
                        Object.entries(modifiersClassNames)
                          .filter(([k]) => m[k])
                          .map(([, v]) => v)
                    )}
                  >
                    {!m.hidden && (
                      <DayButton
                        day={{ date, displayMonth, outside: !!m.outside }}
                        modifiers={m}
                        locale={locale}
                        disabled={m.disabled}
                        aria-selected={m.selected || undefined}
                        aria-label={`${m.today ? "Today, " : ""}${format(date, "PPPP", { locale })}${m.selected ? ", selected" : ""}`}
                        className={cn(
                          classNames.day_button,
                          // `[&:first-child[data-selected=true]_button]:rounded-l-md` and
                          // `[&:last-child[data-selected=true]_button]:rounded-r-md`.
                          m.selected && first && "rounded-l-md",
                          m.selected && last && "rounded-r-md"
                        )}
                        onPress={() => handlePress(date, m)}
                      >
                        {fmtDay(date, { locale })}
                      </DayButton>
                    )}
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      </View>
    )
  }

  const navButton = cellSized("size-(--cell-size) p-0 select-none aria-disabled:opacity-50")

  return (
    <View
      data-slot="calendar"
      className={cn(
        "w-fit",
        classNames.root,
        // `in-data-[slot=…]:` for `[[data-slot=card-content]_&]:` and `[[data-slot=popover-content]_&]:`.
        "group/calendar bg-background p-3 [--cell-size:--spacing(8)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        className
      )}
      {...viewProps}
    >
      <View className={cn("relative flex flex-col gap-4 md:flex-row", classNames.months)}>
        {!hideNavigation && (
          <View
            style={{ pointerEvents: "box-none" }}
            className={cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", "z-10", classNames.nav)}
          >
            <Button
              variant={buttonVariant}
              aria-label="Go to the Previous Month"
              disabled={!canPrev}
              className={cn(navButton, classNames.button_previous)}
              onPress={() => goToMonth(addMonths(month, -1))}
            >
              {/* `rtl:**:[.rdp-button_previous>svg]:rotate-180` */}
              <Icon as={ChevronLeftIcon} className="size-4 rtl:rotate-180" />
            </Button>
            <Button
              variant={buttonVariant}
              aria-label="Go to the Next Month"
              disabled={!canNext}
              className={cn(navButton, classNames.button_next)}
              onPress={() => goToMonth(addMonths(month, 1))}
            >
              <Icon as={ChevronRightIcon} className="size-4 rtl:rotate-180" />
            </Button>
          </View>
        )}
        {Array.from({ length: numberOfMonths }, (_, i) => renderMonth(addMonths(month, i), i))}
      </View>
    </View>
  )
}

function CalendarDayButton({ className, day, modifiers, locale, ...props }: CalendarDayButtonProps) {
  // Upstream focuses the button when react-day-picker moves keyboard focus; there
  // is no grid keyboard navigation on native.
  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={!!modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle}
      data-range-start={!!modifiers.range_start}
      data-range-end={!!modifiers.range_end}
      data-range-middle={!!modifiers.range_middle}
      className={cn(
        "flex aspect-square size-auto w-full flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-accent-foreground",
        cellSized("min-w-(--cell-size)"),
        // `[&>span]:text-xs [&>span]:opacity-70` (secondary text under the day) is dropped:
        // style that Text directly.
        className
      )}
      {...props}
    />
  )
}

export {
  Calendar,
  CalendarDayButton,
  type CalendarProps,
  type CalendarDayButtonProps,
  type CalendarDay,
  type DateRange,
  type Matcher,
  type Modifiers,
}
