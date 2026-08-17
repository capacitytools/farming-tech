"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TYPES = [
  { key: "adsterra_native", label: "1. Native Banner Ads", where: "Shows between posts, under comments, on Reels, Blog & AI Doctor pages." },
  { key: "adsterra_popunder", label: "2. Popunder / Push Ads", where: "Runs in the background on EVERY page of the site." },
  { key: "adsterra_socialbar", label: "3. Social Bar / Banner Ads", where: "Runs on EVERY page of the site." },
];

export default function AdminAdsPage() {
  const [rows, setRows] = useState<any>({});
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("settings").select("key, value");
    const map: any = {};
    (data || []).forEach((r: any) => {
      try { map[r.key] = JSON.parse(r.value); } catch { map[r.key] = { on: false, code: "" }; }
    });
    setRows(map);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function save(key: string, next: any) {
    setRows({ ...rows, [key]: next });
    const supabase = createClient();
    await supabase.from("settings").upsert({ key, value: JSON.stringify(next) });
    setMsg("Saved ✅ The whole site obeys this switch immediately.");
    setTimeout(() => setMsg(""), 2500);
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">💰 Adsterra Ads Manager</h1>
      <p className="text-xs text-gray-500 mb-4">The ON/OFF key sits in front of each ad type. ON = ads run everywhere. OFF = ads vanish everywhere. Instantly.</p>
      {msg && <p className="text-xs font-bold text-green-700 mb-3">{msg}</p>}

      <div className="space-y-4">
        {TYPES.map((t) => {
          const cfg = rows[t.key] || { on: false, code: "" };
          return (
            <div key={t.key} className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => save(t.key, { ...cfg, on: !cfg.on })}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold flex-shrink-0 ${cfg.on ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"}`}
                >
                  {cfg.on ? "ON ✅" : "OFF ⛔"}
                </button>
                <div>
                  <p className="text-sm font-bold">{t.label}</p>
                  <p className="text-[10px] text-gray-500">{t.where}</p>
                </div>
              </div>
              <textarea
                className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-[10px] font-mono"
                rows={4}
                placeholder="Paste this ad type's Adsterra script code here..."
                value={cfg.code}
                onChange={(e) => setRows({ ...rows, [t.key]: { ...cfg, code: e.target.value } })}
              />
              <button onClick={() => save(t.key, cfg)} className="mt-1 w-full bg-forest-600 text-white py-2 rounded-xl text-sm font-bold">💾 Save Code</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}