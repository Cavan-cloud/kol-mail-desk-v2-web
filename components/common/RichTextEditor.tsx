"use client";

import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon
} from "lucide-react";
import { useEffect, useRef } from "react";

const PRESET_COLORS = [
  { label: "默认", value: "#182126" },
  { label: "强调橙", value: "#f59e0b" },
  { label: "品牌青", value: "#0f766e" },
  { label: "警示红", value: "#dc2626" },
  { label: "中性灰", value: "#6b7280" }
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  heightClass?: string;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, heightClass, placeholder }: Props) {
  const lastEmittedRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        // StarterKit ships with Bold/Italic/BulletList/OrderedList/Link-friendly nodes.
      }),
      Underline,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank"
        }
      })
    ],
    editorProps: {
      attributes: {
        class: `tiptap-editor ${heightClass ?? ""}`.trim(),
        "data-placeholder": placeholder ?? ""
      }
    },
    content: value || "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    }
  });

  // External value changes (AI draft, translation) → push into the editor
  // without echoing back through onUpdate.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    const next = value || "";
    if (editor.getHTML() === next) return;
    lastEmittedRef.current = next;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return (
      <div className={`text-field-glass p-3 text-sm text-muted ${heightClass ?? ""}`}>编辑器加载中…</div>
    );
  }

  function promptForLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("插入链接 URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().unsetLink().run();
      return;
    }
    const safe = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
    editor!.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
  }

  return (
    <div className="rounded-2xl border border-white/70 bg-white/[0.80] shadow-inset">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/70 px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="加粗"
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
        >
          <Italic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="下划线"
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line/70" />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="无序列表"
        >
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="有序列表"
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line/70" />
        <ToolbarButton active={editor.isActive("link")} onClick={promptForLink} title="插入链接">
          <Link2 className="size-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line/70" />
        <div className="flex items-center gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.label}
              onClick={() =>
                color.value === "#182126"
                  ? editor.chain().focus().unsetColor().run()
                  : editor.chain().focus().setColor(color.value).run()
              }
              className="size-4 rounded-full border border-white/70 shadow-inset"
              style={{ background: color.value }}
            />
          ))}
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex size-7 items-center justify-center rounded-full text-xs transition ${
        active ? "bg-accent text-white shadow-inset" : "bg-white/60 text-ink hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

// Convert the editor's HTML output to a sane plain-text fallback for the
// text/plain MIME alternative. Keep it dumb on purpose.
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>(\r?\n)?/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isEditorEmpty(html: string): boolean {
  return !html || html.replace(/<[^>]+>/g, "").trim() === "";
}
