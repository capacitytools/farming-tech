"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("refCode", ref);
  }, []);

  async function submit(e: any) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else router.push("/");
    } else {
      const ref = localStorage.getItem("refCode") || new URLSearchParams(window.location.search).get("ref");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setMsg(error.message);
      } else {
        const uid = data.user?.id;
        if (uid) {
          const code = "FT" + uid.replace(/-/g, "").slice(0, 6).toUpperCase();
          const { data: existing } = await supabase.from("profiles").select("referral_code").eq("id", uid).single();
          await supabase.from("profiles").upsert(
            {
              id: uid,              full_name: fullName,
              phone: phone || null,
              whatsapp: whatsapp || null,
              location: location || null,
              referral_code: existing?.referral_code || code,
              referred_by: ref || null,
            },
            { onConflict: "id" }
          );
        }
        localStorage.removeItem("refCode");
        setMsg("Account created! Now log in. 🎉");
        setMode("login");
      }
    }
    setBusy(false);
  }

  const input = "w-full p-3 rounded-xl border border-gray-200 bg-white/70";

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="text-center mb-6 mt-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-forest-600 flex items-center justify-center text-3xl mb-3">🌾</div>
        <h1 className="text-2xl font-extrabold">Farming Tech & Business</h1>
        <p className="text-sm text-gray-500">Farm smarter. Sell faster. Grow together.</p>
      </div>

      <div className="glass-card p-5 rounded-2xl">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setMode("login")} className={`py-2 rounded-xl font-bold text-sm ${mode === "login" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>Log In</button>
          <button onClick={() => setMode("signup")} className={`py-2 rounded-xl font-bold text-sm ${mode === "signup" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>Sign Up</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input className={input} placeholder="Full name *" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input className={input} placeholder="Phone (e.g. 0803...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className={input} placeholder="WhatsApp number (with country code)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              <input className={input} placeholder="Location (town, state)" value={location} onChange={(e) => setLocation(e.target.value)} />
            </>
          )}
          <input className={input} type="email" placeholder="Email *" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" placeholder="Password *" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          {msg && <p className="text-sm text-center text-green-700">{msg}</p>}
          <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "🔓 Log In" : "🌱 Create My Account"}
          </button>
        </form>      </div>
    </div>
  );
}