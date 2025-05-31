import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import Placeholder from "@tiptap/extension-placeholder";
import { Text, Box } from "@mantine/core";

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
}

export const CustomRichTextEditor: React.FC<RichTextEditorProps> = ({
  value = "",
  onChange,
  placeholder = "Describe your event in detail...",
  label,
  error,
  required,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <Box>
      {label && (
        <Text
          component="label"
          size="sm"
          fw={500}
          mb="xs"
          style={{
            color: error ? "#fa5252" : "var(--mantine-color-text)",
          }}
        >
          {label}
          {required && (
            <Text span c="red" ml={4}>
              *
            </Text>
          )}
        </Text>
      )}

      <RichTextEditor
        editor={editor}
        style={{
          border: error
            ? "1px solid #fa5252"
            : "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.9)",
          overflow: "hidden",
        }}
      >
        <RichTextEditor.Toolbar
          sticky
          stickyOffset={60}
          style={{
            background: "rgba(249, 250, 251, 0.95)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
          }}
        >
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Highlight />
            <RichTextEditor.Code />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Subscript />
            <RichTextEditor.Superscript />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignJustify />
            <RichTextEditor.AlignRight />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content
          style={{
            minHeight: "150px",
            padding: "20px",
            fontSize: "16px",
            lineHeight: "1.6",
          }}
        />
      </RichTextEditor>

      {error && (
        <Text size="sm" c="red" mt="xs">
          {error}
        </Text>
      )}
    </Box>
  );
};
