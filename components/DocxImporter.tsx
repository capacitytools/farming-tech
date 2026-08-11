"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DocxImporter({ onImport }: { onImport: (html: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handle(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const mammoth: any = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const supabase = createClient();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: mammoth.images.imgElement(async (image: any) => {
            const b64 = await image.read("base64");
            const ext = (image.contentType || "image/png").split("/")[1] || "png";
            const path = `docx-img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const blob = await (await fetch(`data:${image.contentType};base64,${b64}`)).blob();
            const { error } = await supabase.storage.from("blog-images").upload(path, blob, { contentType: image.contentType });
            if (error) throw new Error(error.message);
            return { src: supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl };
          }),
        }
      );
      onImport(result.value);
      setMsg("Document imported ✅ Your article is in the editor below!");
    } catch (err: any) {
      setMsg("Import failed: " + (err?.message || "unknown error"));
    }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <div className="glass-card p-4 rounded-2xl space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">📄 Write in Google Docs?</p>
        <a href="https://docs.google.com" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600">Open Google Docs ↗</a>
      </div>
      <p className="text-xs text-gray-500">
        Write your article in Google Docs with images & links, then go to <b>File → Download → Microsoft Word (.docx)</b> and upload it here. Everything appears in the editor below.
      </p>
      <label className="block bg-blue-600 text-white text-center py-2 rounded-xl font-semibold text-sm cursor-pointer">
        {busy ? "Importing…" : "⬆️ Upload .docx file"}
        <input type="file" accept=".docx" onChange={handle} className="hidden" disabled={busy} />
      </label>
      {msg && <p className="text-xs text-center text-green-700">{msg}</p>}
    </div>
  );
}