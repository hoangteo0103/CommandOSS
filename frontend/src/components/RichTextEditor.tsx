import { useCallback, useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import BlotFormatter from "quill-blot-formatter";
import { Text, Box } from "@mantine/core";
import React from "react";
import { storageApi } from "../services/api";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

// Register the BlotFormatter module
Quill.register("modules/blotFormatter", BlotFormatter);

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
  const quillRef = useRef<ReactQuill>(null);

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const result = await storageApi.uploadFile(file);
      if (result.data?.url) {
        notifications.show({
          title: "Upload Successful",
          message: "Image uploaded successfully",
          color: "green",
          icon: <IconCheck size={16} />,
        });
        return result.data.url;
      }
      throw new Error("Upload failed");
    } catch (error) {
      notifications.show({
        title: "Upload Failed",
        message: "Failed to upload image. Please try again.",
        color: "red",
        icon: <IconX size={16} />,
      });
      throw error;
    }
  };

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      // Save current cursor state
      const range = quill.getSelection(true);

      // Insert temporary loading placeholder
      quill.insertEmbed(
        range.index,
        "image",
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIHN0cm9rZT0iIzMzOEVGNyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxwYXRoIGQ9Ik0xNiA4VjI0IiBzdHJva2U9IiMzMzhFRjciIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik04IDE2SDI0IiBzdHJva2U9IiMzMzhFRjciIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo="
      );

      // Move cursor to right side of image
      quill.setSelection(range.index + 1);

      try {
        const imageUrl = await uploadFile(file);

        // Remove placeholder image
        quill.deleteText(range.index, 1);

        // Insert uploaded image
        quill.insertEmbed(range.index, "image", imageUrl);
      } catch (error) {
        // Remove placeholder on error
        quill.deleteText(range.index, 1);
      }
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
      blotFormatter: {
        overlay: {
          style: {
            border: "2px solid #3b82f6",
          },
        },
      },
    }),
    [imageHandler]
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "align",
    "color",
    "background",
    "code-block",
  ];

  return (
    <Box>
      {label && (
        <Text
          component="label"
          size="md"
          fw={600}
          mb="xs"
          c={error ? "red" : "dark"}
        >
          {label}
          {required && (
            <Text span c="red" ml={4}>
              *
            </Text>
          )}
        </Text>
      )}

      <Box
        style={{
          border: error ? "2px solid #fa5252" : "2px solid #ced4da",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
        }}
      >
        <ReactQuill
          ref={quillRef}
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{
            backgroundColor: "#ffffff",
          }}
          theme="snow"
        />
      </Box>

      {error && (
        <Text size="sm" c="red" mt="xs">
          {error}
        </Text>
      )}

      <style>{`
        .ql-editor {
          min-height: 180px;
          font-size: 16px;
          line-height: 1.6;
          color: #212529;
        }
        
        .ql-toolbar {
          border-bottom: 1px solid #ced4da !important;
          background-color: #f8f9fa;
        }
        
        .ql-container {
          border: none !important;
          font-family: inherit;
        }
        
        .ql-editor.ql-blank::before {
          color: #6c757d;
          font-style: normal;
        }
        
        /* Better button styles */
        .ql-toolbar .ql-picker-label {
          color: #495057;
        }
        
        .ql-toolbar .ql-picker-options {
          background-color: white;
          border: 1px solid #ced4da;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .ql-toolbar button {
          color: #495057;
        }
        
        .ql-toolbar button:hover {
          color: #212529;
        }
        
        .ql-toolbar button.ql-active {
          color: #3b82f6;
        }
        
        /* Image resizing handles */
        .blot-formatter__toolbar {
          background: white;
          border: 1px solid #ced4da;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .blot-formatter__toolbar-button {
          color: #495057;
          border: none;
          background: none;
          padding: 4px 8px;
        }
        
        .blot-formatter__toolbar-button:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </Box>
  );
};
