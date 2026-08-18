"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("reports")
      .select("*, profiles!reports_reporter_id_fkey(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    // Fetch target content details manually since supabase joins on dynamic types are tricky
    const enriched = await Promise.all((data || []).map(async (r) => {
      let target: any = null;
      if (r.target_type === "post") {
        const { data: p } = await supabase.from("feed_posts").select("*, profiles(full_name)").eq("id", r.target_id).single();
        target = p;
      }
      return { ...r, target };
    }));

    setReports(enriched);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function deletePostAndResolve(report: any) {
    if (!confirm("Delete this post and mark report as resolved?")) return;
    const supabase = createClient();
    await supabase.from("feed_posts").delete().eq("id", report.target_id);
    await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id);
    load();
  }

  async function dismissReport(report: any) {
    if (!confirm("Dismiss this report as false?")) return;
    const supabase = createClient();
    await supabase.from("reports").update({ status: "dismissed" }).eq("id", report.id);
    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading reports...</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Moderation Queue</h1>
      <p className="text-xs text-gray-500 mb-4">Review reported posts. Delete bad content or dismiss false reports.</p>

      <div className="space-y-4">
        {reports.map((r) => (
          <div key={r.id} className="glass-card p-4 rounded-2xl border-l-4 border-red-500">
            <p className="text-[10px] text-red-600 font-bold mb-1">REPORTED BY: {r.profiles?.full_name || "User"}</p>
            <p className="text-xs text-gray-600 mb-3">Reason: {r.reason}</p>
            
            {r.target && (
              <div className="bg-gray-50 p-3 rounded-xl mb-3">
                <p className="text-xs font-bold text-gray-800 mb-1">Post by {r.target.profiles?.full_name}:</p>
                <p className="text-sm text-gray-700 line-clamp-4">{r.target.content}</p>
                {r.target.image_url && <img src={r.target.image_url} alt="" className="mt-2 w-full h-32 object-cover rounded-lg" />}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => deletePostAndResolve(r)} className="flex-1 bg-red-600 text-white py-2 rounded-xl text-xs font-bold">Delete Post</button>
              <button onClick={() => dismissReport(r)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-bold">Dismiss Report</button>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="text-4xl mb-2">✅</p>
            <p className="font-bold">All clear! No pending reports.</p>
          </div>
        )}
      </div>
    </div>
  );
}