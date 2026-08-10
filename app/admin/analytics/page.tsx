import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { currencySymbol } from "@/lib/currency";

export default async function AdminAnalytics() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>;

  // Fetch all stats in parallel for speed
  const [
    { count: totalUsers },
    { count: totalBlogs },
    { data: blogsViews },
    { count: activeListings },
    { count: pendingListings },
    { count: totalTribes },
    { data: tribeMembers },
    { data: ebookSales },
    { count: totalEbooks },
    { count: totalScans },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("blogs").select("*", { count: "exact", head: true }),
    supabase.from("blogs").select("views_count"),
    supabase.from("livestock_listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("livestock_listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("tribes").select("*", { count: "exact", head: true }),
    supabase.from("tribes").select("member_count"),
    supabase.from("ebook_purchases").select("amount, currency").eq("status", "paid"),
    supabase.from("ebooks").select("*", { count: "exact", head: true }),
    supabase.from("ai_scans").select("*", { count: "exact", head: true }),
  ]);

  const totalViews = (blogsViews || []).reduce((sum, b) => sum + (b.views_count || 0), 0);
  const totalTribeMembers = (tribeMembers || []).reduce((sum, t) => sum + (t.member_count || 0), 0);

  // Group e-book sales by currency
  const revenueByCurrency: Record<string, number> = {};
  (ebookSales || []).forEach((sale) => {
    const curr = sale.currency || "NGN";
    revenueByCurrency[curr] = (revenueByCurrency[curr] || 0) + Number(sale.amount || 0);
  });

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📊 Platform Analytics</h1>
      <p className="text-gray-600 text-sm mb-6">Real-time overview of your farming empire.</p>
      <h2 className="font-bold text-lg mb-3">👥 Community & Content</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard icon="🧑‍🌾" label="Registered Users" value={totalUsers || 0} />
        <StatCard icon="👁️" label="Total Blog Views" value={totalViews} />
        <StatCard icon="📝" label="Blog Posts" value={totalBlogs || 0} />
        <StatCard icon="🌾" label="Tribes Created" value={totalTribes || 0} />
        <StatCard icon="👥" label="Tribe Memberships" value={totalTribeMembers} />
        <StatCard icon="🩺" label="AI Scans Done" value={totalScans || 0} />
      </div>

      <h2 className="font-bold text-lg mb-3">🐄 Marketplace Health</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard icon="🟢" label="Active Listings" value={activeListings || 0} color="green" />
        <StatCard icon="⏳" label="Pending Approval" value={pendingListings || 0} color="yellow" />
      </div>

      <h2 className="font-bold text-lg mb-3">📚 E-Book Revenue</h2>
      <div className="glass-card p-5 rounded-2xl mb-6">
        <p className="text-sm text-gray-500 mb-1">Total Books in Store: <span className="font-bold text-gray-800">{totalEbooks || 0}</span></p>
        <p className="text-sm text-gray-500 mb-4">Total Transactions: <span className="font-bold text-gray-800">{ebookSales?.length || 0}</span></p>
        
        {Object.keys(revenueByCurrency).length > 0 ? (
          <div className="space-y-3">
            <p className="font-bold text-lg text-forest-700 mb-2">Total Earned:</p>
            {Object.entries(revenueByCurrency).map(([curr, amount]) => (
              <div key={curr} className="flex justify-between items-center bg-forest-50 dark:bg-forest-800 p-4 rounded-xl">
                <span className="font-semibold text-forest-800 dark:text-forest-100">{curr}</span>
                <span className="text-2xl font-bold text-green-600">
                  {currencySymbol(curr)}{amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-4">No e-book sales yet. Share your store to start earning!</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = "blue" }: { icon: string; label: string; value: number; color?: string }) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
  };
  return (
    <div className="glass-card p-4 rounded-2xl flex items-center gap-3">      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color] || colors.blue}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 font-semibold">{label}</p>
      </div>
    </div>
  );
}