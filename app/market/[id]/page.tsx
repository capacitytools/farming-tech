import { createClient } from "@/lib/supabase/server";

export default async function ListingDetailPage(props: any) {
  const params = await props.params;
  const supabase = createClient();
  const { data: listing } = await supabase
    .from("livestock_listings")
    .select("*, tribes(name, icon), profiles(full_name, phone, whatsapp, location)")
    .eq("id", params.id)
    .single();

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {!listing ? (
        <div className="text-center py-10 text-gray-500">Listing not found or not active.</div>
      ) : (
        <>
          <div className="glass-card p-5 rounded-2xl shadow-lg mb-4">
            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold mb-2">
              <span>{listing.tribes?.icon}</span>
              <span>{listing.tribes?.name}</span>
              {listing.is_featured && <span className="ml-auto text-amber-500">⭐ Featured</span>}
            </div>
            <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
            <p className="text-gray-700 mb-4">{listing.description}</p>
            <div className="text-3xl font-bold text-green-700 mb-4">₦{Number(listing.price).toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/60 rounded-xl p-3"><p className="text-gray-500">Breed</p><p className="font-semibold">{listing.breed || "—"}</p></div>
              <div className="bg-white/60 rounded-xl p-3"><p className="text-gray-500">Age</p><p className="font-semibold">{listing.age || "—"}</p></div>
              <div className="bg-white/60 rounded-xl p-3"><p className="text-gray-500">Quantity</p><p className="font-semibold">{listing.quantity}</p></div>
              <div className="bg-white/60 rounded-xl p-3"><p className="text-gray-500">Location</p><p className="font-semibold">{listing.location || "—"}</p></div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl shadow-lg">
            <h2 className="font-bold mb-2">Seller</h2>
            <p className="font-semibold">{listing.profiles?.full_name || "Farmer"}</p>
            {listing.profiles?.phone && <p className="text-sm text-gray-600">📞 {listing.profiles.phone}</p>}
            {listing.profiles?.whatsapp && (
              <a className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold" href={`https://wa.me/${listing.profiles.whatsapp}`}>Chat on WhatsApp</a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
