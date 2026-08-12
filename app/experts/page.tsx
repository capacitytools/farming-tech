import { createClient } from "@/lib/supabase/server";
import BookExpert from "@/components/BookExpert";

export default async function ExpertsPage() {
  const supabase = createClient();
  const { data: experts } = await supabase.from("experts").select("*").order("created_at", { ascending: false });

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🎓 Expert Directory</h1>
      <p className="text-gray-600 text-sm mb-6">Trusted specialists — call, chat, or book a paid consultation.</p>

      <div className="space-y-3">
        {(experts || []).map((x: any) => (
          <div key={x.id} className="glass-card p-4 rounded-2xl">
            <div className="flex gap-3">
              {x.image_url ? (
                <img src={x.image_url} className="w-16 h-16 rounded-full object-cover" alt={x.name} />
              ) : (
                <div className="w-16 h-16 rounded-full bg-forest-200 flex items-center justify-center text-xl font-bold text-forest-800">
                  {x.name?.[0]}
                </div>
              )}
              <div className="flex-1">
                <h2 className="font-bold">{x.name}</h2>
                <p className="text-xs font-semibold text-green-700">{x.specialty}</p>
                <p className="text-[10px] text-gray-500">📍 {x.location}</p>
              </div>
            </div>
            {x.bio && <p className="text-sm text-gray-700 mt-3">{x.bio}</p>}
            <div className="flex gap-2 mt-3">
              {x.whatsapp && (
                <a href={`https://wa.me/${x.whatsapp}`} className="flex-1 bg-green-600 text-white text-center py-2 rounded-xl text-sm font-bold">💬 WhatsApp</a>
              )}
              {x.phone && (
                <a href={`tel:${x.phone}`} className="flex-1 bg-forest-600 text-white text-center py-2 rounded-xl text-sm font-bold">📞 Call</a>
              )}
              <BookExpert expertId={x.id} fee={Number(x.consultation_fee || 0)} name={x.name} />
            </div>
            {Number(x.consultation_fee || 0) > 0 && (
              <p className="text-[10px] text-gray-400 mt-2">📅 Consultation: ₦{Number(x.consultation_fee).toLocaleString()} · platform takes 10% service fee</p>
            )}
          </div>
        ))}
        {(!experts || experts.length === 0) && (
          <p className="text-center text-gray-500 py-10">No experts listed yet — check back soon!</p>
        )}
      </div>
    </div>
  );
}