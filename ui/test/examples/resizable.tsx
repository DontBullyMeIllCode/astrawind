import * as React from "react"
import { Text, View } from "@astrawind/css"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@astrawind/ui/resizable"

export default function ResizableExample() {
  return (
    <View className="flex-col gap-6">
      {/* One group per parent: with siblings, the web resolves its `h-full` against their total height. */}
      <View>
        <ResizablePanelGroup orientation="horizontal" className="max-w-sm rounded-lg border md:min-w-[450px]">
          <ResizablePanel defaultSize="50%">
            <View className="flex h-[200px] items-center justify-center p-6">
              <Text className="font-semibold">One</Text>
            </View>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="50%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="25%">
                <View className="flex h-full items-center justify-center p-6">
                  <Text className="font-semibold">Two</Text>
                </View>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize="75%">
                <View className="flex h-full items-center justify-center p-6">
                  <Text className="font-semibold">Three</Text>
                </View>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </View>

      <View>
        <ResizablePanelGroup orientation="horizontal" className="min-h-[200px] max-w-md rounded-lg border md:min-w-[450px]">
          <ResizablePanel defaultSize="25%" minSize="15%" maxSize="50%">
            <View className="flex h-full items-center justify-center p-6">
              <Text className="font-semibold">Sidebar</Text>
            </View>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="75%">
            <View className="flex h-full items-center justify-center p-6">
              <Text className="font-semibold">Content</Text>
            </View>
          </ResizablePanel>
        </ResizablePanelGroup>
      </View>

      <View>
        <ResizablePanelGroup direction="vertical" className="min-h-[200px] max-w-md rounded-lg border md:min-w-[450px]">
          <ResizablePanel defaultSize={25}>
            <View className="flex h-full items-center justify-center p-6">
              <Text className="font-semibold">Header</Text>
            </View>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
            <View className="flex h-full items-center justify-center p-6">
              <Text className="font-semibold">Content</Text>
            </View>
          </ResizablePanel>
        </ResizablePanelGroup>
      </View>
    </View>
  )
}
