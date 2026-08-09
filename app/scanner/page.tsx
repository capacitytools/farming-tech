"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function fileToBase64(file: File, maxSize = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const severityStyle: any = {
  low: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function ScannerPage() {
  const [preview, setPreview] = useState("");
  const [tribe, setTribe] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setLoggedIn(!!user);
      if (user) {
        const { data } = await supabase.from("ai_scans").select("*").order("created_at", { ascending: false }).limit(5);        setHistory(data || []);
      }
    })();
  }, []);

  async function onFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    const b64 = await fileToBase64(file);
    setPreview(b64);
  }

  async function diagnose() {
    if (!preview) {
      setError("Take or choose a photo first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview, tribe }),
      });
      const data = await res.json();
      if (!res.ok) setError(data?.error || "Scan failed. Try again.");
      else setResult(data);
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🩺 AI Agri-Doctor</h1>
      <p className="text-gray-600 text-sm mb-6">Snap a photo of a sick plant or animal and get an instant AI diagnosis + treatment plan.</p>

      <div className="glass-card p-5 rounded-2xl shadow-lg mb-6">
        <label className="block w-full cursor-pointer">
          <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
          {preview ? (
            <img src={preview} alt="scan preview" className="w-full h-56 object-cover rounded-xl" />
          ) : (
            <div className="h-40 rounded-xl bg-forest-50 dark:bg-forest-800 flex flex-col items-center justify-center text-forest-600 dark:text-forest-200">
              <span className="text-4xl mb-2">📷</span>
              <span className="font-semibold text-sm">Tap to take / choose a photo</span>            </div>
          )}
        </label>

        <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 mt-4" value={tribe} onChange={(e) => setTribe(e.target.value)}>
          <option value="">What type of farm subject? (optional)</option>
          <option value="Poultry">Poultry</option>
          <option value="Rabbits">Rabbits</option>
          <option value="Goats">Goats</option>
          <option value="Pigs">Pigs</option>
          <option value="Fish">Fish</option>
          <option value="Dogs">Dogs</option>
          <option value="Crops">Crops / Plants</option>
        </select>

        <button onClick={diagnose} disabled={loading} className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
          {loading ? "🔬 Analyzing..." : "Diagnose Now"}
        </button>

        {error && <p className="text-sm text-red-600 text-center mt-3">{error}</p>}
        {!loggedIn && <p className="text-xs text-gray-500 text-center mt-3">💡 Log in to save your scan history.</p>}
      </div>

      {result && (
        <div className="glass-card p-5 rounded-2xl shadow-lg mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">🧾 Health Report</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${severityStyle[result.severity] || "bg-gray-100 text-gray-700"}`}>
              {result.severity}
            </span>
          </div>
          <p className="font-semibold text-gray-800 mb-1">{result.diagnosis}</p>
          <p className="text-xs text-gray-500 mb-4">Confidence: {result.confidence}%</p>

          {result.symptoms?.length > 0 && (
            <div className="mb-4">
              <p className="font-bold text-sm mb-1">⚠️ Symptoms spotted</p>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.symptoms.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {result.treatment_plan?.length > 0 && (
            <div className="mb-4">
              <p className="font-bold text-sm mb-1">💊 Treatment plan</p>
              <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                {result.treatment_plan.map((t: string, i: number) => <li key={i}>{t}</li>)}
              </ol>
            </div>          )}

          {result.advice && <p className="text-sm text-forest-700 dark:text-forest-200 bg-forest-50 dark:bg-forest-800 p-3 rounded-xl">🌱 {result.advice}</p>}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="font-bold mb-3">🕘 Recent scans</h2>
          <div className="space-y-3">
            {history.map((h: any) => (
              <div key={h.id} className="glass-card p-4 rounded-2xl flex items-center gap-3">
                {h.image_url && <img src={h.image_url} alt="scan" className="w-14 h-14 rounded-xl object-cover" />}
                <div>
                  <p className="font-semibold text-sm">{h.diagnosis}</p>
                  <p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleDateString()} · {h.severity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}