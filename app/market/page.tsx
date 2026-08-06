import { createClient } from "@/lib/supabase/server";

export default async function MarketPage() {
  const supabase = createClient();
  const { data: listings } = await supabase
    .from("livestock_listings")
    .select("*, tribes(name, icon)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🐄 Livestock Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings && listings.length > 0 ? (
          listings.map((listing: any) => (
            <div key={listing.id} className="glass-card p-4 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-2 text-sm text-green-600 font-semibold">
                <span>{listing.tribes?.icon}</span>
                <span>{listing.tribes?.name}</span>
              </div>
              <h2 className="font-bold text-lg mb-1">{listing.title}</h2>
              <p className="text-sm text-gray-600 mb-3">{listing.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-green-700">
                  ₦{listing.price.toLocaleString()}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  Qty: {listing.quantity}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">📍 {listing.location}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-10">No active listings yet.</p>
        )}
      </div>
    </div>
  );
}