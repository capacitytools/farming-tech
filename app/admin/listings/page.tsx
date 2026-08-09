import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ListingActions from "@/components/ListingActions";

export default async function AdminListings() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>;

  const { data: pending } = await supabase
    .from("livestock_listings")
    .select("*, profiles(full_name), tribes(name, icon)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: active } = await supabase
    .from("livestock_listings")
    .select("*, profiles(full_name), tribes(name, icon)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🐄 Listings Manager</h1>

      <h2 className="font-bold mb-3">⏳ Pending approval ({pending?.length || 0})</h2>
      <div className="space-y-3 mb-8">
        {pending && pending.length > 0 ? (
          pending.map((l: any) => (
            <div key={l.id} className="glass-card p-4 rounded-2xl">
              {l.images?.[0] && <img src={l.images[0]} alt={l.title} className="w-full h-40 object-cover rounded-xl mb-3" />}
              <h3 className="font-bold">{l.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {l.tribes?.icon} {l.tribes?.name} · by {l.profiles?.full_name || "Farmer"} · ₦{Number(l.price).toLocaleString()} × {l.quantity}
              </p>
              <p className="text-sm text-gray-700 mt-2">{l.description}</p>
              <ListingActions id={l.id} status={l.status} />
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">Nothing waiting for approval.</p>
        )}
      </div>

      <h2 className="font-bold mb-3">🟢 Live listings</h2>
      <div className="space-y-3">
        {active && active.length > 0 ? (
          active.map((l: any) => (
            <div key={l.id} className="glass-card p-4 rounded-2xl">
              <h3 className="font-bold">{l.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{l.tribes?.icon} {l.tribes?.name} · ₦{Number(l.price).toLocaleString()}</p>
              <ListingActions id={l.id} status={l.status} />
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No live listings yet.</p>
        )}
      </div>
    </div>
  );
}