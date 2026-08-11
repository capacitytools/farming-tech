"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SUBJECTS = ["Crop / Plant", "Poultry", "Goats", "Cattle", "Pigs", "Rabbits", "Fish", "Other"];

export default function ScannerPage() {
  const [image, setImage] = useState("");
  const [subject, setSubject] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scans, setScans] = useState<any[]>([]);

  async function loadScans() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("ai_scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6);
      setScans(data || []);
    }
  }

  useEffect(() => {
    loadScans();
  }, []);

  function onFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function diagnose() {
    if (!image) {
      setError("Please take or upload a photo first.");
      return;
    }
    setBusy(true);
    setError("");
    setResult("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let imageUrl = "";      try {
        const blob = await (await fetch(image)).blob();
        const path = `scan-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("scan-images").upload(path, blob, { contentType: "image/jpeg" });
        if (!upErr) imageUrl = supabase.storage.from("scan-images").getPublicUrl(path).data.publicUrl;
      } catch {}

      const base64 = image.split(",")[1];
      const mime = image.split(";")[0].split(":")[1];

      const res = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: { base64, mime }, subject }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError("AI error: " + (json.error || "diagnosis failed"));
      } else {
        setResult(json.result);
        if (user) {
          const sevMatch = (json.result || "").match(/SEVERITY:\s*([A-Za-z]+)/i);
          await supabase.from("ai_scans").insert({
            user_id: user.id,
            image_url: imageUrl,
            diagnosis: json.result,
            severity: sevMatch ? sevMatch[1] : "Medium",
          });
          loadScans();
        }
      }
    } catch (e: any) {
      setError("AI error: " + (e?.message || "network problem"));
    }
    setBusy(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🩺 AI Agri-Doctor</h1>
      <p className="text-gray-600 text-sm mb-6">Snap a photo of a sick plant or animal → get an instant AI diagnosis + treatment plan.</p>

      <div className="glass-card p-5 rounded-2xl shadow-lg">
        {image && <img src={image} alt="scan preview" className="w-full h-64 object-cover rounded-xl mb-4" />}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="bg-forest-700 text-white text-center py-3 rounded-xl font-semibold cursor-pointer">
            📷 Take Photo
            <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />          </label>
          <label className="bg-forest-100 text-forest-800 text-center py-3 rounded-xl font-semibold cursor-pointer">
            🖼️ Upload Image
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
        </div>

        <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 mb-4" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">What type of farm subject? (optional)</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button onClick={diagnose} disabled={busy} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">
          {busy ? " Analyzing..." : "Diagnose Now"}
        </button>

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}

        {result && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-bold text-green-800 mb-2">🩺 Doctor's Report</h3>
            <p className="text-sm text-gray-800 whitespace-pre-line">{result}</p>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">🕐 Recent scans</h2>
      <div className="space-y-3">
        {scans.length ? (
          scans.map((s) => (
            <div key={s.id} className="glass-card p-3 rounded-2xl flex gap-3">
              {s.image_url && <img src={s.image_url} alt="scan" className="w-16 h-16 object-cover rounded-xl" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-600">Severity: {s.severity}</p>
                <p className="text-xs text-gray-700 line-clamp-3 whitespace-pre-line">{s.diagnosis}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center">No scans yet — log in and diagnose your first photo!</p>
        )}
      </div>
    </div>
  );
}
