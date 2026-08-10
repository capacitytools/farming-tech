"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Color,
      TextStyle,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  async function addImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file);
      if (!error) {
        const url = supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
        editor?.chain().focus().setImage({ src: url }).run();      }
    };
    input.click();
  }

  function setLink() {
    const url = window.prompt("Enter URL:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white/70">
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("bold") ? "bg-green-600 text-white" : "bg-white"}`}>
          <b>B</b>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("italic") ? "bg-green-600 text-white" : "bg-white"}`}>
          <i>I</i>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("underline") ? "bg-green-600 text-white" : "bg-white"}`}>
          <u>U</u>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("strike") ? "bg-green-600 text-white" : "bg-white"}`}>
          <s>S</s>
        </button>
        <select onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} className="px-2 py-1 rounded text-sm bg-white border border-gray-300">
          <option value="">Color</option>
          <option value="#000000">Black</option>
          <option value="#dc2626">Red</option>
          <option value="#16a34a">Green</option>
          <option value="#2563eb">Blue</option>
          <option value="#d97706">Orange</option>
        </select>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 1 }) ? "bg-green-600 text-white" : "bg-white"}`}>
          H1
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 2 }) ? "bg-green-600 text-white" : "bg-white"}`}>
          H2
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 3 }) ? "bg-green-600 text-white" : "bg-white"}`}>
          H3
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("bulletList") ? "bg-green-600 text-white" : "bg-white"}`}>
          • List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("orderedList") ? "bg-green-600 text-white" : "bg-white"}`}>
          1. List
        </button>        <button type="button" onClick={addImage} className="px-2 py-1 rounded text-sm bg-white border border-gray-300">
          📷 Image
        </button>
        <button type="button" onClick={setLink} className={`px-2 py-1 rounded text-sm ${editor.isActive("link") ? "bg-green-600 text-white" : "bg-white border border-gray-300"}`}>
          🔗 Link
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: "left" }) ? "bg-green-600 text-white" : "bg-white"}`}>
          ⬅️
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: "center" }) ? "bg-green-600 text-white" : "bg-white"}`}>
          ↔️
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: "right" }) ? "bg-green-600 text-white" : "bg-white"}`}>
          ➡️
        </button>
      </div>
      <EditorContent editor={editor} className="p-4 min-h-[300px] prose prose-sm max-w-none" />
    </div>
  );
}