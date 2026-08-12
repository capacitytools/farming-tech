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

  const [payouts, adReqs, videos, trainers, consults, featured, ebookReqs, feedPosts, blogs, listings, notes, tribes, ebooks, comments] = await Promise.all([
    supabase.from("payout_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("ad_campaigns").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("videos").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("trainer_requested", true),
    supabase.from("consultations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("livestock_listings").select("id", { count: "exact", head: true }).eq("featured_requested", true),
    supabase.from("ebooks").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("feed_posts").select("id", { count: "exact", head: true }),
    supabase.from("blogs").select("id", { count: "exact", head: true }),
    supabase.from("livestock_listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("admin_notes").select("id", { count: "exact", head: true }),
    supabase.from("tribes").select("id", { count: "exact", head: true }),
    supabase.from("ebooks").select("id", { count: "exact", head: true }),
    supabase.from("blog_comments").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, Site Admin 👋 Everything is one tap away.</p>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/admin/wallet" className="glass-card p-4 rounded-2xl border-2 border-green-300">
          <div className="text-3xl mb-2">💵</div>
          <h3 className="font-bold">Wallet Control</h3>
          <p className="text-sm text-gray-600">{payouts.count || 0} payout requests</p>
        </Link>
        <Link href="/admin/ads-manager" className="glass-card p-4 rounded-2xl border-2 border-amber-300">          <div className="text-3xl mb-2">📢</div>
          <h3 className="font-bold">Ads Command Center</h3>
          <p className="text-sm text-gray-600">{adReqs.count || 0} ad requests</p>
        </Link>
        <Link href="/admin/videos" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🎬</div>
          <h3 className="font-bold">Videos & Ad Slots</h3>
          <p className="text-sm text-gray-600">{videos.count || 0} videos</p>
        </Link>
        <Link href="/admin/trainers" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🎙️</div>
          <h3 className="font-bold">Approved Trainers</h3>
          <p className="text-sm text-gray-600">{trainers.count || 0} pending requests</p>
        </Link>
        <Link href="/admin/consultations" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🎓</div>
          <h3 className="font-bold">Consultations</h3>
          <p className="text-sm text-gray-600">{consults.count || 0} bookings</p>
        </Link>
        <Link href="/admin/featured" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">⭐</div>
          <h3 className="font-bold">Featured Listings</h3>
          <p className="text-sm text-gray-600">{featured.count || 0} requests</p>
        </Link>
        <Link href="/admin/ebook-requests" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-bold">E-book Requests</h3>
          <p className="text-sm text-gray-600">{ebookReqs.count || 0} pending</p>
        </Link>
        <Link href="/admin/feed" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">📣</div>
          <h3 className="font-bold">Moderate Feed</h3>
          <p className="text-sm text-gray-600">{feedPosts.count || 0} posts</p>
        </Link>
        <Link href="/admin/analytics" className="glass-card p-4 rounded-2xl border-2 border-purple-200">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-bold">Analytics</h3>
          <p className="text-sm text-gray-600">Views, sales & ranks</p>
        </Link>
        <Link href="/admin/blogs/ai-writer" className="glass-card p-4 rounded-2xl border-2 border-purple-200">
          <div className="text-3xl mb-2">🤖</div>
          <h3 className="font-bold">AI Writer</h3>
          <p className="text-sm text-gray-600">Veteran blog writer</p>
        </Link>
        <Link href="/admin/blogs" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">📝</div>
          <h3 className="font-bold">Blog Posts</h3>
          <p className="text-sm text-gray-600">{blogs.count || 0} posts</p>
        </Link>
        <Link href="/admin/comments" className="glass-card p-4 rounded-2xl">          <div className="text-3xl mb-2">💬</div>
          <h3 className="font-bold">Comments</h3>
          <p className="text-sm text-gray-600">{comments.count || 0} to moderate</p>
        </Link>
        <Link href="/admin/listings" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🐄</div>
          <h3 className="font-bold">Pending Listings</h3>
          <p className="text-sm text-gray-600">{listings.count || 0} awaiting approval</p>
        </Link>
        <Link href="/admin/notifications" className="glass-card p-4 rounded-2xl border-2 border-red-200">
          <div className="text-3xl mb-2">🔔</div>
          <h3 className="font-bold">Announcements</h3>
          <p className="text-sm text-gray-600">Broadcast + push</p>
        </Link>
        <Link href="/admin/ebooks" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-bold">E-books</h3>
          <p className="text-sm text-gray-600">{ebooks.count || 0} books for sale</p>
        </Link>
        <Link href="/admin/tribes" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🌾</div>
          <h3 className="font-bold">Tribes</h3>
          <p className="text-sm text-gray-600">{tribes.count || 0} communities</p>
        </Link>
        <Link href="/admin/ads" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-bold">Adsterra Ads</h3>
          <p className="text-sm text-gray-600">Manage ad scripts</p>
        </Link>
        <Link href="/admin/notes" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🗒️</div>
          <h3 className="font-bold">Notepad</h3>
          <p className="text-sm text-gray-600">{notes.count || 0} private documents</p>
        </Link>
        <Link href="/admin/settings" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">⚙️</div>
          <h3 className="font-bold">Site Settings</h3>
          <p className="text-sm text-gray-600">Announcements and more</p>
        </Link>
        <Link href="/leaderboard" className="glass-card p-4 rounded-2xl">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-bold">Leaderboard</h3>
          <p className="text-sm text-gray-600">Public top farmers</p>
        </Link>
      </div>
    </div>
  );
}