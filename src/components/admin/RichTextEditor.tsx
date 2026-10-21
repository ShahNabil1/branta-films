import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyleKit, TextAlign.configure({ types: ["heading", "paragraph"] })],
    content: value, immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "rich-text min-h-52 p-4 focus:outline-none", "aria-label": "Rich text content" } },
  });
  if (!editor) return null;
  const actions = [
    { label: "Bold", icon: Bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: "Italic", icon: Italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Underline", icon: Underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: "Bullet list", icon: List, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrdered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Align left", icon: AlignLeft, run: () => editor.chain().focus().setTextAlign("left").run() },
    { label: "Align center", icon: AlignCenter, run: () => editor.chain().focus().setTextAlign("center").run() },
    { label: "Align right", icon: AlignRight, run: () => editor.chain().focus().setTextAlign("right").run() },
    { label: "Undo", icon: Undo, run: () => editor.chain().focus().undo().run() },
    { label: "Redo", icon: Redo, run: () => editor.chain().focus().redo().run() },
  ];
  return <div className="overflow-hidden rounded-md border border-input bg-background">
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
      {actions.map((action) => <Button key={action.label} type="button" size="icon" variant="ghost" title={action.label} aria-label={action.label} onClick={action.run}><action.icon className="size-4" /></Button>)}
      <select aria-label="Font size" className="rounded-md border border-input bg-background p-2 text-small" onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()} defaultValue="16px">
        {["14px", "16px", "20px", "24px", "32px"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <label title="Text color" className="flex items-center gap-2 px-2 text-small">Color<input type="color" aria-label="Text color" className="size-7" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} /></label>
    </div>
    <EditorContent editor={editor} />
  </div>;
}