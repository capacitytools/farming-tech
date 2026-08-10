import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const { data: blogs } = await supabase.from("blogs").select("id").limit(10);
  const { data: listings } = await supabase.from("livestock_listings").select("id").eq("status", "pending").limit(10);
  const { data: notes } = await supabase.from("admin_notes").select("id").limit(10);
  const { data: tribes } = await supabase.from("tribes").select("id").limit(20);
  const { data: ebooks } = await supabase.from("ebooks").select("id").limit(10);

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, Site Admin 👋</p>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/admin/analytics" className="glass-card p-4 rounded-2xl border-2 border-purple-200">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-bold">Analytics</h3>
          <p className="text-sm text-gray-600">Views, sales & growth</p>
        </Link>
        <Link href="/admin/blogs" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">📝</div>
          <h3 className="font-bold">Blog Posts</h3>
          <p className="text-sm text-gray-600">{blogs?.length || 0} recent</p>
        </Link>
        <Link href="/admin/listings" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🐄</div>
          <h3 className="font-bold">Pending Listings</h3>
          <p className="text-sm text-gray-600">{listings?.length || 0} awaiting approval</p>
        </Link>
        <Link href="/admin/notes" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🗒️</div>
          <h3 className="font-bold">Notepad</h3>
          <p className="text-sm text-gray-600">{notes?.length || 0} private documents</p>
        </Link>
        <Link href="/admin/ads" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-bold">Adsterra Ads</h3>
          <p className="text-sm text-gray-600">Manage ad scripts</p>
        </Link>
        <Link href="/admin/ebooks" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-bold">E-books</h3>
          <p className="text-sm text-gray-600">{ebooks?.length || 0} books for sale</p>
        </Link>
        <Link href="/admin/tribes" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🌾</div>
          <h3 className="font-bold">Tribes</h3>
          <p className="text-sm text-gray-600">{tribes?.length || 0} communities</p>
        </Link>
        <Link href="/admin/settings" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">⚙️</div>
          <h3 className="font-bold">Site Settings</h3>
          <p className="text-sm text-gray-600">Announcements and more</p>
        </Link>
      </div>
    </div>
  );
}