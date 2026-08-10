"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
      setItems(data || []);
      localStorage.setItem("notifSeen", new Date().toISOString());
      setLoaded(true);
    })();
  }, []);

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔔 Notifications</h1>
      <div className="space-y-3">
        {items.length ? (
          items.map((n) => (
            <div key={n.id} className="glass-card p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0">📢</div>
                <div>
                  <h3 className="font-bold text-sm">{n.title}</h3>
                  {n.message && <p className="text-sm text-gray-600 mt-1">{n.message}</p>}
                  <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-10">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}