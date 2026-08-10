"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/RichTextEditor";

export default function EditBlogPage() {
  const [id, setId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get("id") || "";
    setId(blogId);
    (async () => {
      if (blogId) {
        const supabase = createClient();
        const { data } = await supabase.from("blogs").select("*").eq("id", blogId).single();
        if (data) {
          setTitle(data.title || "");
          setExcerpt(data.excerpt || "");
          setContent(data.content || "");
          setCategory(data.category || "");
          setTags((data.tags || []).join(", "));
          setCoverImage(data.cover_image_url || "");
          setSeoTitle(data.seo_title || "");
          setSeoDescription(data.seo_description || "");
          setStatus(data.status || "draft");
        }
      }
      setLoaded(true);
    })();
  }, []);

  async function uploadImage(file: File): Promise<string> {
    const supabase = createClient();    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleCoverUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverImage(url);
      setMessage("Cover updated ✅");
    } catch (err: any) {
      setMessage("Upload failed: " + err.message);
    }
    setUploading(false);
  }

  async function handleSave(e: any) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase
      .from("blogs")
      .update({
        title,
        excerpt,
        content,
        cover_image_url: coverImage || null,
        category,
        tags: tagArray,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) setMessage("Error: " + error.message);
    else router.push("/admin/blogs");
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this blog post permanently?")) return;    const supabase = createClient();
    await supabase.from("blogs").delete().eq("id", id);
    router.push("/admin/blogs");
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🛠️ Edit Blog</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Blog title *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="text-sm font-semibold text-gray-600">Cover image</label>
          <input type="file" accept="image/*" onChange={handleCoverUpload} className="w-full text-sm mt-1" />
          {coverImage && <img src={coverImage} alt="cover" className="mt-2 h-32 w-full object-cover rounded-xl" />}
        </div>
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 block">Article content *</label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Tags, separated, by, commas" value={tags} onChange={(e) => setTags(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="SEO description" rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
        <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">Draft (hidden)</option>
          <option value="published">Published (live)</option>
        </select>
        {message && <p className="text-sm text-center text-red-600">{message}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50" disabled={loading || uploading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={handleDelete} className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold">
          🗑️ Delete Post
        </button>
      </form>
    </div>
  );
}