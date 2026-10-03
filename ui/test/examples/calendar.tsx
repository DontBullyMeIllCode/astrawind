import * as React from "react"
import { addDays } from "date-fns"
import { View } from "@astrawind/css"
import { Calendar, type DateRange } from "@astrawind/ui/calendar"
import { Card, CardContent } from "@astrawind/ui/card"

export default function CalendarExample() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2025, 5, 12))
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(2025, 5, 9),
    to: addDays(new Date(2025, 5, 9), 12),
  })
  const [dates, setDates] = React.useState<Date[] | undefined>([new Date(2025, 5, 3), new Date(2025, 5, 18)])

  return (
    <View className="flex-col gap-4">
      <Calendar
        mode="single"
        defaultMonth={date}
        selected={date}
        onSelect={setDate}
        className="rounded-md border shadow-sm"
        captionLayout="dropdown"
      />
      <Calendar
        mode="range"
        defaultMonth={range?.from}
        selected={range}
        onSelect={setRange}
        numberOfMonths={2}
        weekStartsOn={1}
        disabled={{ before: new Date(2025, 5, 2) }}
        className="rounded-lg border shadow-sm"
      />
      <Card className="w-fit py-4">
        <CardContent className="px-4">
          <Calendar
            mode="multiple"
            selected={dates}
            onSelect={setDates}
            defaultMonth={new Date(2025, 5, 1)}
            showOutsideDays={false}
            showWeekNumber
            buttonVariant="outline"
            className="bg-transparent p-0 [--cell-size:--spacing(10)]"
          />
        </CardContent>
      </Card>
    </View>
  )
}
