import { createClient } from "@/lib/supabase/server";

export default async function ExpertsPage() {
  const supabase = createClient();
  const { data: experts } = await supabase
    .from("teachers")
    .select("*, profiles(full_name, avatar_url, location)")
    .eq("is_active", true);

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">👨‍🏫 Expert Directory</h1>
      <p className="text-gray-600 mb-8">Connect with verified agricultural experts and consultants.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {experts && experts.length > 0 ? (
          experts.map((expert: any) => (
            <div key={expert.id} className="glass-card p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
                  {expert.profiles?.full_name?.[0] || "E"}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{expert.profiles?.full_name}</h2>
                  <p className="text-sm text-gray-500">{expert.profiles?.location || "Remote"}</p>
                </div>
              </div>
              <p className="font-semibold text-green-700 mb-2">{expert.specialty}</p>
              {expert.headline && <p className="text-sm text-gray-700 mb-4">{expert.headline}</p>}
              <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200">
                <span className="text-gray-600">⭐ {expert.rating.toFixed(1)} ({expert.reviews_count} reviews)</span>
                <span className="font-bold text-green-800">₦{expert.hourly_rate?.toLocaleString()}/hr</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-10">No experts listed yet.</p>
        )}
      </div>
    </div>
  );
}