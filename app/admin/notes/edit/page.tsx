"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NoteEditorPage() {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get("id") || "";
    setId(noteId);
    (async () => {
      if (noteId) {
        const supabase = createClient();
        const { data } = await supabase.from("admin_notes").select("*").eq("id", noteId).single();
        if (data) {
          setTitle(data.title || "");
          setContent(data.content || "");
        }
      }
      setLoaded(true);
    })();
  }, []);

  async function handleSave(e: any) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();
    if (id) {
      const { error } = await supabase
        .from("admin_notes")
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) { setMessage("Error: " + error.message); return; }
    } else {
      const { error } = await supabase.from("admin_notes").insert({ title, content });
      if (error) { setMessage("Error: " + error.message); return; }
    }
    router.push("/admin/notes");
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this note?")) return;
    const supabase = createClient();
    await supabase.from("admin_notes").delete().eq("id", id);
    router.push("/admin/notes");
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{id ? "🗒️ Edit Note" : "🗒️ New Note"}</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Note name / title *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Write your document here... you can come back and edit it anytime." rows={14} value={content} onChange={(e) => setContent(e.target.value)} />
        {message && <p className="text-sm text-center text-red-600">{message}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">💾 Save Note</button>
        {id && (
          <button type="button" onClick={handleDelete} className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold">
            🗑️ Delete Note
          </button>
        )}
      </form>
    </div>
  );
}