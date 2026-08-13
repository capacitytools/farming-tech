"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("refCode", ref);
  }, []);

  async function login(e: any) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg("Login failed: " + error.message);
    else router.push("/feed");
    setBusy(false);
  }

  async function google() {
    setMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/feed" },
    });
    if (error) setMsg("Google login not ready yet: " + error.message + " — use email below, or ask admin to enable Google in Supabase → Authentication → Providers.");
  }

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="text-center mt-8 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-forest-600 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">🌾</span>
        </div>
        <h1 className="text-2xl font-extrabold text-forest-900">Welcome back!</h1>
        <p className="text-sm text-gray-500 mt-1">Join · Learn · Grow · Connect · Earn</p>
      </div>
      <div className="glass-card p-5 rounded-2xl space-y-4">
        {/* GOOGLE ONE-TAP */}
        <button
          type="button"
          onClick={google}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span className="font-extrabold text-blue-600">G</span> Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <p className="text-[10px] text-gray-400 font-bold">OR USE EMAIL</p>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={login} className="space-y-3">
          <input
            className="w-full p-3 rounded-xl border border-gray-200 bg-white/70"
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-xl border border-gray-200 bg-white/70"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {msg && <p className="text-xs text-red-600 text-center">{msg}</p>}
          <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50" disabled={busy}>
            {busy ? "Logging in..." : "🔓 Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          New here?{" "}
          <Link href="/register" className="font-bold text-green-700 underline">
            Create FREE account 🎁
          </Link>
        </p>
        <p className="text-center text-[10px] text-gray-400">
          Forgot password? Use "Reset password" on the register page or contact admin on WhatsApp.
        </p>
      </div>
      <div className="bg-gradient-to-r from-green-600 to-forest-700 text-white p-4 rounded-2xl text-center mt-6">
        <p className="text-xs font-bold">💵 Remember: every like, post, comment & minute here earns you points → monthly money!</p>
      </div>
    </div>
  );
}