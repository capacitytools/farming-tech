import { createClient } from "@/lib/supabase/server";
import { currencySymbol } from "@/lib/currency";
import ListingReviews from "@/components/ListingReviews";
import SoldButton from "@/components/SoldButton";
import FeatureButton from "@/components/FeatureButton";

export default async function ListingDetailPage(props: any) {
  const params = await props.params;
  const supabase = createClient();
  const { data: listing } = await supabase
    .from("livestock_listings")
    .select("*, tribes(name, icon), profiles(full_name, phone, whatsapp, location)")
    .eq("id", params.id)
    .single();

  const { data: { user } } = await supabase.auth.getUser();
  const isSeller = user && listing && user.id === listing.seller_id;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {!listing ? (
        <div className="text-center py-10 text-gray-500">Listing not found or not active.</div>
      ) : (
        <>
          <div className="glass-card p-5 rounded-2xl shadow-lg mb-4">
            {listing.images?.[0] && (
              <img src={listing.images[0]} alt={listing.title} className="w-full h-56 object-cover rounded-xl mb-4" />
            )}
            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold mb-2">
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
              {listing.is_featured && <span className="ml-auto text-amber-500">⭐ Featured</span>}
            </div>
            <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
            {listing.status === "sold" && (
              <p className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-2">SOLD ✅</p>
            )}
            <p className="text-gray-700 mb-4">{listing.description}</p>
            <div className="text-3xl font-bold text-green-700 mb-4">
              {currencySymbol(listing.currency)}{Number(listing.price).toLocaleString()}
            </div>
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
            <div className="flex flex-wrap gap-2">
              <a className="inline-block mt-3 bg-white border border-forest-600 text-forest-700 px-4 py-2 rounded-xl font-semibold text-sm" href={`/farmer/${listing.seller_id}`}>
                👤 View Profile & Reviews
              </a>
              {listing.profiles?.whatsapp && (
                <a className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold text-sm" href={`https://wa.me/${listing.profiles.whatsapp}`}>
                  WhatsApp
                </a>
              )}
              {user && !isSeller && (
                <>
                  <a className="inline-block mt-3 bg-forest-600 text-white px-4 py-2 rounded-xl font-semibold text-sm" href={`/inbox?user=${listing.seller_id}`}>
                    💬 Message
                  </a>
                  <a className="inline-block mt-3 bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold text-sm" href={`/inbox?user=${listing.seller_id}&text=${encodeURIComponent(`Hello! I'm interested in "${listing.title}". My offer is: ${currencySymbol(listing.currency)}`)}`}>
                    💰 Make Offer
                  </a>
                </>
              )}
            </div>
            {isSeller && (
              <>
                <SoldButton id={listing.id} status={listing.status} />
                {!listing.is_featured && !listing.featured_requested && <FeatureButton id={listing.id} />}
                {listing.featured_requested && <p className="mt-2 text-xs text-amber-600 font-semibold text-center">⭐ Feature request pending — pay ₦300 via WhatsApp receipt & admin will activate it.</p>}
              </>
            )}
          </div>

          <ListingReviews listingId={listing.id} />
        </>
      )}
    </div>
  );
}