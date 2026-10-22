import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RichTextEditor({ value, onChange, onReady, editable = true }: { value: string; onChange: (html: string) => void; onReady?: (html: string) => void; editable?: boolean }) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyleKit, TextAlign.configure({ types: ["heading", "paragraph"] })],
    content: value, immediatelyRender: false, editable,
    onCreate: ({ editor }) => onReady?.(editor.getHTML()),
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "rich-text min-h-52 p-4 focus:outline-none", "aria-label": "Rich text content" } },
  });
  useEffect(() => { editor?.setEditable(editable); }, [editor, editable]);
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
  const isOn = (label: string) => ({ Bold: editor.isActive("bold"), Italic: editor.isActive("italic"), Underline: editor.isActive("underline"), "Bullet list": editor.isActive("bulletList"), "Numbered list": editor.isActive("orderedList"), "Align left": editor.isActive({ textAlign: "left" }), "Align center": editor.isActive({ textAlign: "center" }), "Align right": editor.isActive({ textAlign: "right" }) } as Record<string, boolean>)[label] ?? false;
  return <div className="overflow-hidden rounded-xl border border-border bg-background/70 transition-all duration-200 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15">
    <div className={`flex flex-wrap items-center gap-1 border-b border-border bg-muted/60 p-1.5 ${editable ? "" : "pointer-events-none opacity-50"}`}>
      {actions.map((action) => <Button key={action.label} type="button" size="icon" variant="ghost" title={action.label} aria-label={action.label} aria-pressed={isOn(action.label)} onClick={action.run} className={`size-8 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:text-primary ${isOn(action.label) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><action.icon className="size-4" /></Button>)}
      <span className="mx-1 h-5 w-px bg-border" />
      <select aria-label="Font size" className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold" onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()} defaultValue="16px">
        {["14px", "16px", "20px", "24px", "32px"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <label title="Text color" className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-2 text-xs font-semibold">Colour<input type="color" aria-label="Text color" className="size-5 cursor-pointer rounded border-0 bg-transparent p-0" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} /></label>
    </div>
    <EditorContent editor={editor} />
  </div>;
}