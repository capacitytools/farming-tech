"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function inferSlot(): string {
  if (typeof window === "undefined") return "timeline";
  const p = window.location.pathname;
  if (p.startsWith("/reels")) return "reels";
  if (p.startsWith("/blog")) return "blog";
  if (p.startsWith("/scanner")) return "scanner";
  return "timeline";
}

export default function AdBanner({ slot, type }: { slot?: string; type?: string }) {
  const mySlot = slot || inferSlot();
  const [cfg, setCfg] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("value").eq("key", "adsterra_" + mySlot).single();
      if (data && data.value) {
        try { setCfg(JSON.parse(data.value)); } catch { setCfg(null); }
      }
    })();
  }, [mySlot]);

  useEffect(() => {
    if (!cfg || !cfg.on || !cfg.code || !ref.current) return;
    ref.current.innerHTML = cfg.code;
    Array.from(ref.current.querySelectorAll("script")).forEach((old) => {
      const s = document.createElement("script");
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      if (old.textContent) s.textContent = old.textContent;
      ref.current?.appendChild(s);
    });
  }, [cfg]);

  if (!cfg || !cfg.on || !cfg.code) return null;
  return <div ref={ref} className="my-3 flex justify-center overflow-hidden" />;
}