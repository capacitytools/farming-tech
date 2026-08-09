import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminBlogs() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>;
  }

  const { data: blogs } = await supabase
    .from("blogs")
    .select("id, title, slug, status, category, views_count, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📝 Blog Posts</h1>
       <Link href={`/admin/blogs/edit?id=${blog.id}`} className="text-green-700 font-semibold text-sm">Edit</Link>
      </div>

      <div className="space-y-3">
        {blogs && blogs.length > 0 ? (
          blogs.map((blog: any) => (
            <div key={blog.id} className="glass-card p-4 rounded-2xl">
              <h3 className="font-bold">{blog.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {blog.status === "published" ? "🟢 Published" : "📄 Draft"} · {blog.category || "Uncategorized"} · 👁️ {blog.views_count || 0} views
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                📅 {blog.published_at ? new Date(blog.published_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : new Date(blog.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <div className="flex gap-4 mt-2">
                <Link href={`/admin/blogs/${blog.id}`} className="text-green-700 font-semibold text-sm">Edit</Link>
                <a href={`https://farming-tech.vercel.app/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold text-sm">View + Copy link</a>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-10">No blog posts yet. Create your first one!</p>
        )}
      </div>
    </div>
  );
}
