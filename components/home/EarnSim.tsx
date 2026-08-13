"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SpinWheel({ userId }: { userId: string | null }) {
  const [show, setShow] = useState(false);
  const [spun, setSpun] = useState(false);
  const [rot, setRot] = useState(0);
  const [prize, setPrize] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("spinSeen")) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (userId && localStorage.getItem("spinPrize") && !localStorage.getItem("spinClaimed")) {
        const supabase = createClient();
        await supabase.from("profiles").update({ welcome_bonus: 50 }).eq("id", userId);
        localStorage.setItem("spinClaimed", "1");
      }
    })();
  }, [userId]);

  function spin() {
    setSpun(true);
    setRot(1440 + 90);
    setTimeout(() => {
      setPrize("50");
      localStorage.setItem("spinPrize", "50");
      localStorage.setItem("spinSeen", "1");
    }, 2600);
  }

  function close() {
    localStorage.setItem("spinSeen", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
        <p className="text-lg font-extrabold text-forest-800">🎁 Welcome Gift!</p>
        <p className="text-xs text-gray-500 mb-4">Spin once — your points are waiting</p>

        <div className="relative w-48 h-48 mx-auto mb-4">
          <div
            className="absolute inset-0 rounded-full border-8 border-forest-600"
            style={{
              background: "conic-gradient(#f59e0b 0 60deg, #166534 60deg 120deg, #f59e0b 120deg 180deg, #166534 180deg 240deg, #f59e0b 240deg 300deg, #166534 300deg 360deg)",
              transform: `rotate(${rot}deg)`,
              transition: spun ? "transform 2.5s cubic-bezier(.17,.67,.12,.99)" : "none",
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-2xl">🔻</div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🌾</div>
        </div>

        {!spun ? (
          <button onClick={spin} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">🎡 SPIN NOW</button>
        ) : prize ? (
          <div>
            <p className="text-2xl font-extrabold text-amber-600 mb-2">🎉 YOU WON {prize} POINTS!</p>
            <Link href="/login" onClick={close} className="block w-full bg-forest-600 text-white py-3 rounded-xl font-bold">🔓 Register FREE to claim (24h only)</Link>
          </div>
        ) : (
          <p className="text-sm text-gray-500 animate-pulse">Spinning...</p>
        )}
        <button onClick={close} className="mt-3 text-xs text-gray-400 underline">no thanks</button>
      </div>
    </div>
  );
}