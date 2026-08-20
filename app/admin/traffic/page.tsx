"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function countBy(list: any[], key: (x: any) => string): [string, number][] {
  const m: Record<string, number> = {};
  list.forEach((x) => {
    const k = key(x) || "unknown";
    m[k] = (m[k] || 0) + 1;
  });
  return Object.keys(m).map((k) => [k, m[k]] as [string, number]).sort((a, b) => b[1] - a[1]);
}

export default function AdminTrafficPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("visits").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(300);
    setVisits(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading traffic…</p>;

  const today = new Date().toISOString().slice(0, 10);
  const todayVisits = visits.filter((v) => (v.created_at || "").slice(0, 10) === today);
  const registered = visits.filter((v) => v.user_id);
  const sources = countBy(visits, (v) => v.source);
  const countries = countBy(visits, (v) => v.country);
  const pages = countBy(visits, (v) => (v.path || "/").split("?")[0]);
  const devices = countBy(visits, (v) => v.device);

  const days: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push({ label: d.toLocaleDateString("en-NG", { weekday: "short" }), count: visits.filter((v) => (v.created_at || "").slice(0, 10) === key).length });
  }
  const max = Math.max(1, ...days.map((d) => d.count));

  const Bar = ({ label, n }: any) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate font-bold text-gray-600">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(n / (visits.length || 1)) * 100}%` }} />      </div>
      <span className="w-8 text-right font-bold text-forest-700">{n}</span>
    </div>
  );

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">🛰️ Visitor Intelligence</h1>
      <p className="text-xs text-gray-500 mb-4">Every visit tracked: source, country, time, landing page, device & registration status.</p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="glass-card p-3 rounded-2xl text-center"><p className="text-xl font-extrabold text-forest-800">{todayVisits.length}</p><p className="text-[9px] text-gray-500 font-bold">📅 Visits Today</p></div>
        <div className="glass-card p-3 rounded-2xl text-center"><p className="text-xl font-extrabold text-forest-800">{visits.length}</p><p className="text-[9px] text-gray-500 font-bold">🌐 Total (recent)</p></div>
        <div className="glass-card p-3 rounded-2xl text-center"><p className="text-xl font-extrabold text-green-700">{registered.length}</p><p className="text-[9px] text-gray-500 font-bold">✅ Registered</p></div>
      </div>

      <div className="glass-card p-4 rounded-2xl mb-4">
        <p className="text-sm font-bold mb-3">📈 Last 7 days</p>
        <div className="flex items-end gap-2 h-24">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-forest-700">{d.count}</span>
              <div className="w-full bg-green-600 rounded-t-lg" style={{ height: `${(d.count / max) * 70 + 4}px` }} />
              <span className="text-[8px] text-gray-400 font-bold">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card p-3 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-gray-500">📡 TRAFFIC SOURCES</p>
          {sources.slice(0, 6).map(([l, n]) => <Bar key={l} label={l} n={n} />)}
        </div>
        <div className="glass-card p-3 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-gray-500">🌍 COUNTRIES</p>
          {countries.slice(0, 6).map(([l, n]) => <Bar key={l} label={l} n={n} />)}
        </div>
        <div className="glass-card p-3 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-gray-500">🚪 LANDING PAGES</p>
          {pages.slice(0, 6).map(([l, n]) => <Bar key={l} label={l} n={n} />)}
        </div>
        <div className="glass-card p-3 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-gray-500">📱 DEVICES</p>
          {devices.map(([l, n]) => <Bar key={l} label={l} n={n} />)}
        </div>
      </div>

      <h2 className="font-bold mb-2">🕵️ Recent visitors</h2>
      <div className="space-y-2">        {visits.slice(0, 50).map((v) => (
          <div key={v.id} className="glass-card p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-extrabold px-2 py-1 rounded-full ${v.user_id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {v.user_id ? "✅ " + (v.profiles?.full_name || "Member") : "👤 GUEST"}
              </span>
              <span className="text-[10px] text-gray-500 ml-auto">{new Date(v.created_at).toLocaleString()}</span>
            </div>
            <p className="text-xs font-bold mt-1">🌍 {v.country}{v.city ? ", " + v.city : ""} · 📡 {v.source} · 📱 {v.device} / {v.browser}</p>
            <p className="text-[10px] text-forest-700 font-mono mt-1">→ {v.path}</p>
            {v.referrer && <p className="text-[9px] text-gray-400 truncate mt-0.5">from: {v.referrer}</p>}
          </div>
        ))}
        {visits.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No visits recorded yet — share a link and watch them roll in!</p>}
      </div>
    </div>
  );
}