"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TimeTracker() {
  const [toast, setToast] = useState("");
  const secondsRef = useRef(0);
  const userRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userRef.current = user?.id || null;
    })();

    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      secondsRef.current += 1;

      // every 60 active seconds → +1 minute saved
      if (secondsRef.current % 60 === 0 && userRef.current) {
        const supabase = createClient();
        supabase.rpc("add_minute", { uid: userRef.current });
      }

      // every 5 minutes → show reward toast
      if (secondsRef.current % 300 === 0) {
        const mins = Math.floor(secondsRef.current / 60);
        setToast(`⏱️ ${mins} min on Farming Tech & Business · +${Math.floor(mins / 5)} pts from time spent — keep growing! 🌾`);
        setTimeout(() => setToast(""), 8000);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  if (!toast) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-forest-700 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl max-w-[90%] text-center animate-pulse">
      {toast}
    </div>
  );
}