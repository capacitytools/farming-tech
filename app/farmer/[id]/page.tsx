import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { currencySymbol } from "@/lib/currency";
import ProfileShare from "@/components/ProfileShare";

const RANK_ICONS: any = {
  "Beginner Star": "⭐",
  "Master Star": "🌟",
  "Premium Star": "💫",
  "Professional Star": "🏅",
  "Golden Star": "👑",
};

export default async function FarmerPage(props: any) {
  const params = await props.params;
  const supabase = createClient();

  const { data: farmer } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, location, role, created_at, whatsapp, verified, referral_code")
    .eq("id", params.id)
    .single();

  if (!farmer) return <div className="p-8 text-center text-gray-500">Farmer not found.</div>;

  const { data: pts } = await supabase.rpc("user_points", { uid: params.id });
  const { data: rank } = await supabase.rpc("user_rank", { uid: params.id });
  const { data: listings } = await supabase
    .from("livestock_listings")
    .select("*")
    .eq("seller_id", params.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);
  const { data: reviews } = await supabase
    .from("listing_reviews")
    .select("*, listings(title), profiles(full_name)")
    .eq("listings.seller_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const avg = reviews && reviews.length ? (reviews.reduce((a: number, r: any) => a + Number(r.rating), 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="glass-card p-5 rounded-2xl text-center mb-4">
        {farmer.avatar_url ? (
          <img src={farmer.avatar_url} alt={farmer.full_name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-green-200 flex items-center justify-center text-3xl font-bold text-green-800 mx-auto mb-3">            {(farmer.full_name || "?")[0]}
          </div>
        )}
        <h1 className="text-xl font-bold">
          {farmer.full_name || "Farmer"} {farmer.verified && <span className="text-sky-500">✅</span>}
        </h1>
        <p className="text-xs text-gray-500 mt-1">{farmer.location || "Nigeria"} · joined {new Date(farmer.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</p>
        {farmer.verified && <p className="text-[10px] font-bold text-sky-600 mt-1">✅ VERIFIED MEMBER — trusted by Farming Tech & Business</p>}
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{RANK_ICONS[rank || "Beginner Star"]} {rank} · {pts || 0} pts</span>
          {farmer.role === "admin" && <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">ADMIN</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-white/60 rounded-xl p-2"><p className="font-bold">{listings?.length || 0}</p><p className="text-[10px] text-gray-500">Listings</p></div>
          <div className="bg-white/60 rounded-xl p-2"><p className="font-bold">{avg ? `⭐ ${avg}` : "—"}</p><p className="text-[10px] text-gray-500">Rating</p></div>
          <div className="bg-white/60 rounded-xl p-2"><p className="font-bold">{reviews?.length || 0}</p><p className="text-[10px] text-gray-500">Reviews</p></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link href={`/inbox?user=${farmer.id}`} className="flex-1 bg-forest-600 text-white py-2 rounded-xl text-sm font-bold">💬 Message</Link>
          {farmer.whatsapp && (
            <a href={`https://wa.me/${farmer.whatsapp}`} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-bold">WhatsApp</a>
          )}
        </div>
        <ProfileShare id={farmer.id} code={farmer.referral_code || ""} name={farmer.full_name || "this farmer"} />
        <p className="text-[9px] text-gray-400 mt-2">Share this profile — anyone who joins through it becomes your referral (+25 pts)! 🎁</p>
      </div>

      <h2 className="font-bold mb-3">🐄 Active Listings</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(listings || []).map((l: any) => (
          <Link key={l.id} href={`/market/${l.id}`} className="glass-card p-3 rounded-2xl">
            {l.images?.[0] ? (
              <img src={l.images[0]} alt={l.title} className="w-full h-24 object-cover rounded-xl mb-2" />
            ) : (
              <div className="w-full h-24 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">🐄</div>
            )}
            <p className="font-semibold text-xs line-clamp-1">{l.title}</p>
            <p className="text-sm font-bold text-green-700 mt-1">{currencySymbol(l.currency)}{Number(l.price).toLocaleString()}</p>
          </Link>
        ))}
        {(!listings || listings.length === 0) && <p className="text-sm text-gray-500 col-span-2">No active listings right now.</p>}
      </div>

      <h2 className="font-bold mb-3">⭐ Reviews Received</h2>
      <div className="space-y-2">
        {(reviews || []).map((r: any) => (
          <div key={r.id} className="glass-card p-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{r.profiles?.full_name || "Buyer"}</p>
              <span className="text-xs text-amber-500">{"⭐".repeat(Number(r.rating))}</span>            </div>
            {r.comment && <p className="text-xs text-gray-700 mt-1">{r.comment}</p>}
            <p className="text-[10px] text-gray-400 mt-1">on {r.listings?.title}</p>
          </div>
        ))}
        {(!reviews || reviews.length === 0) && <p className="text-sm text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  );
}