"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminAds() {
  const [native, setNative] = useState("");
  const [push, setPush] = useState("");
  const [banner, setBanner] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("admin_settings").select("*").eq("id", 1).single();
      if (data) {
        setNative(data.adsterra_native_script || "");
        setPush(data.adsterra_push_script || "");
        setBanner(data.adsterra_banner_script || "");
      }
    })();
  }, []);

  async function handleSave(e: any) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("admin_settings")
      .update({
        adsterra_native_script: native,
        adsterra_push_script: push,
        adsterra_banner_script: banner,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) setMessage("Error: " + error.message);
    else setMessage("✅ Ads saved! They will appear on the site in about 1 minute.");
    setLoading(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">💰 Adsterra Ads Manager</h1>
      <p className="text-gray-600 text-sm mb-6">
        Paste your Adsterra script codes below. They will automatically load on every page of your site to generate revenue.
      </p>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-bold mb-1">1. Native Banner Script</label>
          <p className="text-xs text-gray-500 mb-2">Usually starts with &lt;script type="text/javascript" src="..."&gt;</p>
          <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 font-mono text-xs" rows={4} value={native} onChange={(e) => setNative(e.target.value)} placeholder="Paste the full <script>...</script> tag here" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">2. Popunder / Push Notification Script</label>
          <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 font-mono text-xs" rows={4} value={push} onChange={(e) => setPush(e.target.value)} placeholder="Paste the full <script>...</script> tag here" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">3. Social Bar / Banner Script</label>
          <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 font-mono text-xs" rows={4} value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="Paste the full <script>...</script> tag here" />
        </div>

        {message && <p className={`text-sm text-center ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}

        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50" disabled={loading}>
          {loading ? "Saving..." : "Save & Activate Ads"}
        </button>
      </form>
    </div>
  );
}