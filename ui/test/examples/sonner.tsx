import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Toaster, toast } from "@astrawind/ui/sonner"

export default function SonnerExample() {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button
        variant="outline"
        onPress={() =>
          toast("Event has been created", {
            description: "Sunday, December 03, 2023 at 9:00 AM",
            action: {
              label: "Undo",
              onClick: () => console.log("Undo"),
            },
          })
        }
      >
        Show Toast
      </Button>
      <Button variant="outline" onPress={() => toast.success("Event has been created")}>
        Success
      </Button>
      <Button variant="outline" onPress={() => toast.info("Be at the area 10 minutes before the event time")}>
        Info
      </Button>
      <Button variant="outline" onPress={() => toast.warning("Event start time cannot be earlier than 8am")}>
        Warning
      </Button>
      <Button variant="outline" onPress={() => toast.error("Event has not been created")}>
        Error
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast.promise<{ name: string }>(
            () => new Promise((resolve) => setTimeout(() => resolve({ name: "Event" }), 2000)),
            {
              loading: "Loading...",
              success: (data) => `${data.name} has been created`,
              error: "Error",
            }
          )
        }
      >
        Promise
      </Button>
      <Toaster position="top-center" />
    </View>
  )
}
