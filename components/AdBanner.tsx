"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdBanner({ slot, type }: { slot?: string; type?: string }) {
  const [cfg, setCfg] = useState<any>(null);
  const [onBlog, setOnBlog] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOnBlog(window.location.pathname.startsWith("/blog"));
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("value").eq("key", "adsterra_native").single();
      if (data && data.value) {
        try { setCfg(JSON.parse(data.value)); } catch { setCfg(null); }
      }
    })();
  }, []);

  useEffect(() => {
    if (!onBlog || !cfg || !cfg.on || !cfg.code || !ref.current) return;
    ref.current.innerHTML = cfg.code;
    Array.from(ref.current.querySelectorAll("script")).forEach((old) => {
      const s = document.createElement("script");
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      if (old.textContent) s.textContent = old.textContent;
      ref.current?.appendChild(s);
    });
  }, [cfg, onBlog]);

  if (!onBlog || !cfg || !cfg.on || !cfg.code) return null;
  return <div ref={ref} className="my-3 flex justify-center overflow-hidden" />;
}