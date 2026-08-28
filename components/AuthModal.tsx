"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthModal({ open, mode, onClose, onSwitch }: { open: boolean; mode: "login" | "register"; onClose: () => void; onSwitch: (m: "login" | "register") => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (open) {
      const q = new URLSearchParams(window.location.search);
      setRef(q.get("ref") || localStorage.getItem("refCode") || "");
    }
  }, [open]);

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/" } });
  }

  async function submit(e: any) {
    e.preventDefault();
    const supabase = createClient();
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) { setBusy(false); return alert(error.message); }
      window.location.href = "/";
    } else {
      if (!name.trim()) { setBusy(false); return alert("Enter your full name."); }
      if (!email.includes("@")) { setBusy(false); return alert("Enter a valid email."); }
      if (pass.length < 6) { setBusy(false); return alert("Password must be at least 6 characters."); }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: { data: { full_name: name.trim() } },
      });
      if (error) { setBusy(false); return alert(error.message); }
      const uid = data.user?.id;
      if (uid) {
        setTimeout(async () => {
          await supabase.from("profiles").update({ full_name: name.trim(), referred_by: ref || null }).eq("id", uid);
        }, 1500);
      }
      if (data.session) {        window.location.href = "/";
      } else {
        setMsg("✅ Account created! Check your email to confirm, then log in and claim your welcome points.");
        onSwitch("login");
      }
    }
    setBusy(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-forest-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-forest-600 flex items-center justify-center text-3xl">🌾</div>
            <h1 className="text-2xl font-extrabold text-forest-900 mt-3">
              {mode === "login" ? "Welcome back" : "Join Farming Tech & Business"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">The G-Chat wing where farmers, tech people & business people learn, connect & EARN.</p>
          </div>

          {msg && <p className="text-xs font-bold text-green-700 text-center mb-3">{msg}</p>}

          <div className="flex mb-3 bg-gray-100 rounded-xl p-1">
            <button onClick={() => onSwitch("login")} className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === "login" ? "bg-white shadow text-forest-700" : "text-gray-500"}`}>🔓 Log In</button>
            <button onClick={() => onSwitch("register")} className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === "register" ? "bg-white shadow text-green-700" : "text-gray-500"}`}>🎁 Register Free</button>
          </div>

          <form onSubmit={submit} className="glass-card p-5 rounded-2xl space-y-3">
            {mode === "register" && (
              <div>
                <p className="text-xs font-bold text-gray-600 mb-1">Full name</p>
                <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="e.g. Adewale Johnson" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">Email (Gmail)</p>
              <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" type="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">Password</p>
              <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" type="password" placeholder={mode === "register" ? "Create password (6+ characters)" : "Your password"} value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            {mode === "register" && ref && (
              <p className="text-[10px] font-bold text-green-700 bg-green-50 rounded-xl p-2 text-center">🎁 Invited with code {ref} — you and your inviter both earn bonus points!</p>
            )}
            <button className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold disabled:opacity-50" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "🔓 Log In" : "🎁 Create Free Account + 50 Welcome Points"}            </button>
            <button type="button" onClick={google} className="w-full bg-white border border-gray-200 py-3 rounded-xl font-bold text-sm text-gray-700">
              Continue with Google (fastest)
            </button>
          </form>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="glass-card p-2 rounded-xl"><p className="text-lg">🩺</p><p className="text-[9px] font-bold text-gray-600">AI Doctor</p></div>
            <div className="glass-card p-2 rounded-xl"><p className="text-lg">💰</p><p className="text-[9px] font-bold text-gray-600">Earn Points</p></div>
            <div className="glass-card p-2 rounded-xl"><p className="text-lg">🐄</p><p className="text-[9px] font-bold text-gray-600">Sell & Buy</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}