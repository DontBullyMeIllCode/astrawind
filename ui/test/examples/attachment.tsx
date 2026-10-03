import * as React from "react"
import { FileTextIcon, ImageIcon, RotateCwIcon, XIcon } from "lucide-react-native"
import { Image, View } from "@astrawind/css"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@astrawind/ui/attachment"
import { Icon } from "@astrawind/ui/icon"

export default function AttachmentExample() {
  return (
    <View className="w-full max-w-md gap-4">
      <AttachmentGroup>
        <Attachment>
          <AttachmentMedia>
            <Icon as={FileTextIcon} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
            <AttachmentDescription>2.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove">
              <Icon as={XIcon} />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="uploading">
          <AttachmentMedia variant="image">
            <Image source={{ uri: "https://github.com/shadcn.png" }} alt="Screenshot" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>screenshot.png</AttachmentTitle>
            <AttachmentDescription>Uploading…</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment state="error">
          <AttachmentMedia>
            <Icon as={ImageIcon} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>photo.heic</AttachmentTitle>
            <AttachmentDescription>Upload failed</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Retry">
              <Icon as={RotateCwIcon} />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </AttachmentGroup>
      <View className="flex-row flex-wrap gap-3">
        <Attachment orientation="vertical">
          <AttachmentMedia>
            <Icon as={FileTextIcon} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>notes.md</AttachmentTitle>
            <AttachmentDescription>4 KB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentTrigger aria-label="Open notes.md" onPress={() => {}} />
        </Attachment>
        <Attachment size="sm" state="idle">
          <AttachmentContent>
            <AttachmentTitle>Drop a file here</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
        <Attachment size="xs" state="processing">
          <AttachmentMedia>
            <Icon as={FileTextIcon} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>data.csv</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
      </View>
    </View>
  )
}
