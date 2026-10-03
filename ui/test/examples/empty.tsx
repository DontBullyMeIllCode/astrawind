import * as React from "react"
import { ArrowUpRightIcon, FolderCodeIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Avatar, AvatarFallback } from "@astrawind/ui/avatar"
import { Button } from "@astrawind/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@astrawind/ui/empty"
import { Icon } from "@astrawind/ui/icon"

export default function EmptyExample() {
  return (
    <View className="w-full gap-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon as={FolderCodeIcon} />
          </EmptyMedia>
          <EmptyTitle>No Projects Yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any projects yet. Get started by creating your first project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <View className="flex-row gap-2">
            <Button>Create Project</Button>
            <Button variant="outline">Import Project</Button>
          </View>
        </EmptyContent>
        <Button variant="link" size="sm" className="text-muted-foreground">
          Learn More
          <Icon as={ArrowUpRightIcon} />
        </Button>
      </Empty>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia>
            <Avatar className="size-12">
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
          </EmptyMedia>
          <EmptyTitle>User Offline</EmptyTitle>
          <EmptyDescription>
            This user is currently offline. You can leave a message to notify them or{" "}
            <Text className="underline underline-offset-4">try again later</Text>.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">Leave Message</Button>
        </EmptyContent>
      </Empty>
    </View>
  )
}
