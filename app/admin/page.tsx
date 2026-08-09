import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const { data: blogs } = await supabase.from("blogs").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5);
  const { data: listings } = await supabase.from("livestock_listings").select("id, title, status").eq("status", "pending").limit(5);
  const { data: settings } = await supabase.from("admin_settings").select("*").eq("id", 1).single();

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, Site Admin 👋</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/admin/blogs" className="glass-card p-4 rounded-2xl hover:scale-105 transition-transform">
          <div className="text-3xl mb-2">📝</div>
          <h3 className="font-bold">Blog Posts</h3>
          <p className="text-sm text-gray-600">{blogs?.length || 0} recent</p>
        </Link>
        
        <Link href="/admin/listings" className="glass-card p-4 rounded-2xl hover:scale-105 transition-transform">
          <div className="text-3xl mb-2">🐄</div>
          <h3 className="font-bold">Pending Listings</h3>
          <p className="text-sm text-gray-600">{listings?.length || 0} awaiting approval</p>
        </Link>
        
        <Link href="/admin/ads" className="glass-card p-4 rounded-2xl hover:scale-105 transition-transform">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-bold">Adsterra Ads</h3>
          <p className="text-sm text-gray-600">Manage ad scripts</p>
        </Link>
        
        <Link href="/admin/settings" className="glass-card p-4 rounded-2xl hover:scale-105 transition-transform">
          <div className="text-3xl mb-2">⚙️</div>
          <h3 className="font-bold">Site Settings</h3>
          <p className="text-sm text-gray-600">Announcements & more</p>
        </Link>
      </div>

      {settings?.site_announcement && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
          <p className="font-semibold text-amber-900">📢 Current Announcement:</p>
          <p className="text-sm text-amber-800 mt-1">{settings.site_announcement}</p>
        </div>
      )}

      {settings?.maintenance_mode && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <p className="font-semibold text-red-900">🚧 Maintenance Mode is ON</p>
          <p className="text-sm text-red-800 mt-1">The site is currently in maintenance mode.</p>
        </div>
      )}
    </div>
  );
}