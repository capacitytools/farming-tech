"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ShareBar from "@/components/ShareBar";

function formatContent(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      if (t.startsWith("<img")) return t;
      const withLinks = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-green-700 font-semibold underline">$1</a>');
      return `<p>${withLinks}</p>`;
    })
    .join("");
}

export default function NewBlogPage() {
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
  const [publishedUrl, setPublishedUrl] = useState("");
  const [publishedTitle, setPublishedTitle] = useState("");
  const router = useRouter();

  function makeSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function uploadImage(file: File): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
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
      setMessage("Cover image uploaded ✅");
    } catch (err: any) {
      setMessage("Upload failed: " + err.message);
    }
    setUploading(false);
  }

  async function handleContentImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setContent((c) => c + `\n<img src="${url}" alt="post image" />`);
      setMessage("Image added inside article ✅");
    } catch (err: any) {
      setMessage("Upload failed: " + err.message);
    }
    setUploading(false);
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

    const slug = makeSlug(title) + "-" + Date.now().toString(36);
    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const { error } = await supabase.from("blogs").insert({
      author_id: user.id,
      title,
      slug,
      excerpt,      content: formatContent(content),
      cover_image_url: coverImage || null,
      category,
      tags: tagArray,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else if (status === "published") {
      setPublishedUrl(`https://farming-tech.vercel.app/blog/${slug}`);
      setPublishedTitle(title);
      setMessage("Published! Share it now 👇");
    } else {
      router.push("/admin/blogs");
    }
    setLoading(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">✍️ Write New Blog</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Blog title *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="text-sm font-semibold text-gray-600">Cover image</label>
          <input type="file" accept="image/*" onChange={handleCoverUpload} className="w-full text-sm mt-1" />
          {coverImage && <img src={coverImage} alt="cover preview" className="mt-2 h-32 w-full object-cover rounded-xl" />}
        </div>
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Short excerpt / summary" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Write your article... (Enter = new paragraph) *" required rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
        <p className="text-xs text-gray-500 -mt-2">Add links like this: [link text](https://example.com) — recommended: 2 outside links + 1 link to your own site.</p>
        <div>
          <label className="text-sm font-semibold text-gray-600">Add image inside article</label>
          <input type="file" accept="image/*" onChange={handleContentImageUpload} className="w-full text-sm mt-1" />
        </div>
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Category (e.g. Poultry)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Tags, separated, by, commas" value={tags} onChange={(e) => setTags(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="SEO title (what Google shows)" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="SEO description (shown under title on Google & share previews)" rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
        <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">Draft (hidden)</option>
          <option value="published">Published (live now)</option>
        </select>
        {uploading && <p className="text-sm text-center text-gray-500">Uploading image…</p>}
        {message && <p className="text-sm text-center text-green-700">{message}</p>}
        {publishedUrl && <ShareBar url={publishedUrl} title={publishedTitle} />}        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50" disabled={loading || uploading}>
          {loading ? "Saving..." : "Save Blog"}
        </button>
      </form>
    </div>
  );
}