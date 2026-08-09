import { createClient } from "@/lib/supabase/server";
import { currencySymbol } from "@/lib/currency";

export default async function MarketPage() {
  const supabase = createClient();
  const { data: listings } = await supabase
    .from("livestock_listings")
    .select("*, tribes(name, icon)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🐄 Livestock Marketplace</h1>
        <a href="/market/new" className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold text-sm">+ Sell</a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings && listings.length > 0 ? (
          listings.map((listing: any) => (
            <a key={listing.id} href={`/market/${listing.id}`} className="glass-card p-4 rounded-2xl shadow-lg block">
              {listing.images?.[0] && (
                <img src={listing.images[0]} alt={listing.title} className="w-full h-36 object-cover rounded-xl mb-3" />
              )}
              <div className="flex items-center gap-2 mb-2 text-sm text-green-600 font-semibold">
                {listing.tribes ? (
                  <>
                    <span>{listing.tribes.icon}</span>
                    <span>{listing.tribes.name}</span>
                  </>
                ) : (
                  <>
                    <span>🧺</span>
                    <span>{listing.custom_category}</span>
                  </>
                )}
              </div>
              <h2 className="font-bold text-lg mb-1">{listing.title}</h2>
              <p className="text-sm text-gray-600 mb-3">{listing.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-green-700">
                  {currencySymbol(listing.currency)}{Number(listing.price).toLocaleString()}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Qty: {listing.quantity}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">📍 {listing.location}</p>
            </a>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-10">No active listings yet.</p>
        )}
      </div>
    </div>
  );
}