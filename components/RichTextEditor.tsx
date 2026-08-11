"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const COLORS = ["#000000", "#166534", "#1d4ed8", "#dc2626", "#d97706", "#7c3aed"];

export default function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  async function addImage(e: any) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `blog-img-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) {
      const url = supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
      editor.chain().focus().setImage({ src: url }).run();
    }
    e.target.value = "";
  }

  function addLink() {
    const url = prompt("Paste the link URL (https://...)");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const btn = "px-2 py-1 rounded-lg text-xs font-bold bg-white/80 border border-gray-200 active:bg-green-100";

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().setTextAlign("left").run()}>⬅</button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().setTextAlign("center").run()}>↔</button>
        <button type="button" className={btn} onClick={addLink}>🔗 Link</button>
        <label className={btn + " cursor-pointer"}>🖼️ Img<input type="file" accept="image/*" onChange={addImage} className="hidden" /></label>
        {COLORS.map((c) => (
          <button key={c} type="button" style={{ backgroundColor: c }} className="w-6 h-6 rounded-full border border-white shadow" onClick={() => editor.chain().focus().setColor(c).run()} />
        ))}
        <button type="button" className={btn} onClick={() => editor.chain().focus().unsetColor().run()}>🎨</button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().undo().run()}>↩</button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().redo().run()}>↪</button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[250px]" />
    </div>
  );
}