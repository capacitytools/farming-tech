"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ONE_SIGNAL_APP_ID = "2873e8a6-070e-4bc4-91cb-123c7cd1c0ef";

export default function AdminNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");
  const [pushing, setPushing] = useState(false);
  const [apiKey, setApiKey] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    setItems(data || []);
    const saved = localStorage.getItem("onesignal_api_key");
    if (saved) setApiKey(saved);
  }
  useEffect(() => {
    load();
  }, []);

  function saveApiKey(k: string) {
    localStorage.setItem("onesignal_api_key", k.trim());
    setApiKey(k.trim());
    setMsg("API key saved — you can now send push notifications! ✅");
  }

  async function send(e: any) {
    e.preventDefault();
    setMsg("");
    setPushing(true);

    const supabase = createClient();
    const { error } = await supabase.from("notifications").insert({ title, message, link: link || null });

    if (error) {
      setMsg("DB error: " + error.message);
      setPushing(false);
      return;
    }

    if (apiKey) {
      try {
        const key = apiKey.trim();        const auth = key.startsWith("os_v2_") ? `Bearer ${key}` : `Basic ${key}`;
        const res = await fetch("https://api.onesignal.com/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: auth,
          },
          body: JSON.stringify({
            app_id: ONE_SIGNAL_APP_ID,
            included_segments: ["Subscribed Users"],
            headings: { en: title },
            contents: { en: message || title },
            web_url: link || "https://farming-tech.vercel.app",
            target_channel: "web",
            chrome_web_icon: "/icons/icon-192x192.png",
            chrome_web_badge: "/icons/icon-192x192.png",
          }),
        });
        const json = await res.json();
        if (res.ok) setMsg("📢 Broadcast sent to all subscribers' phones!");
        else setMsg("Push failed: " + (json.errors?.[0]?.message || JSON.stringify(json)));
      } catch (err: any) {
        setMsg("Push error: " + err.message);
      }
    } else {
      setMsg("Saved to announcements. Add API key below to also push to phones 📱");
    }

    setTitle("");
    setMessage("");
    setLink("");
    load();
    setPushing(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔔 Broadcast Announcement</h1>

      {!apiKey && (
        <div className="glass-card p-4 rounded-2xl mb-4 border-2 border-amber-300">
          <p className="text-sm font-bold text-amber-700 mb-2">🔑 Add your OneSignal API Key (once)</p>
          <p className="text-xs text-gray-500 mb-3">            Paste the <b>os_v2_app_...</b> key you just copied. Stored only in YOUR browser — never shared.
          </p>
          <input
            type="password"
            placeholder="Paste os_v2_app_... key here"
            className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm"
            onBlur={(e) => e.target.value && saveApiKey(e.target.value)}
          />
        </div>
      )}

      <form onSubmit={send} className="glass-card p-5 rounded-2xl space-y-4 mb-8">
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Title, e.g. New e-book released! *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Message (shows on phone lock screen)" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Open link when tapped (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
        {msg && <p className="text-sm text-center text-green-700">{msg}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold" disabled={pushing}>
          {pushing ? "Sending..." : apiKey ? "📱 Broadcast + Push to Phones" : "📢 Broadcast (add API key for push)"}
        </button>
      </form>

      <h2 className="font-bold mb-3">Sent announcements</h2>
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">{n.title}</h3>
              <p className="text-xs text-gray-500 mt-1 truncate">{n.message}</p>
            </div>
            <button onClick={() => remove(n.id)} className="text-red-600 text-sm font-semibold ml-3">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}