"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) setMessage(error.message);
      else {
        setMessage("Account created! You are logged in.");
        router.push("/profile");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else router.push("/profile");
    }
    setLoading(false);
  }

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="glass-card p-6 rounded-2xl shadow-lg mt-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              className="w-full p-3 rounded-xl border border-gray-200 bg-white/70"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="w-full p-3 rounded-xl border border-gray-200 bg-white/70"
            placeholder="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-xl border border-gray-200 bg-white/70"
            placeholder="Password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {message && <p className="text-sm text-red-600 text-center">{message}</p>}
          <button
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>
        <button
          className="w-full mt-4 text-sm text-green-700 font-semibold"
          onClick={() => {
            setIsSignup(!isSignup);
            setMessage("");
          }}
        >
          {isSignup ? "Already have an account? Log in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}