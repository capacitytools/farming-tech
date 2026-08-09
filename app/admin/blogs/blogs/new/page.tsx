"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewBlogPage() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function makeSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const { error } = await supabase.from("blogs").insert({
      author_id: user.id,
      title,
      slug: makeSlug(title) + "-" + Date.now().toString(36),
      excerpt,
      content: content.split("\n").map((p) => p.trim() ? `<p>${p}</p>` : "").join(""),
      cover_image_url: coverImage || null,
      category,
      tags: tagArray,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Blog saved!");
      router.push("/admin/blogs");
    }
    setLoading(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">✍️ Write New Blog</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Blog title *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Short excerpt / summary" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Write your article here... (press Enter for a new paragraph) *" required rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Category (e.g. Poultry)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Tags, separated, by, commas" value={tags} onChange={(e) => setTags(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Cover image URL (optional)" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
        <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">Draft (hidden)</option>
          <option value="published">Published (live now)</option>
        </select>
        {message && <p className="text-sm text-center text-red-600">{message}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50" disabled={loading}>
          {loading ? "Saving..." : "Save Blog"}
        </button>
      </form>
    </div>
  );
}