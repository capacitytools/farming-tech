"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// MASTER SWITCH: change false to true when you want Adsterra ads back on
const ENABLE_ADSTERRA = false;

// Optional: paste your Adsterra script codes here later if you want a fallback
const FALLBACK_CODE: any = {
  native: "",
  "banner-300": "",
};

export default function AdBanner({ type }: { type: string }) {
  const [code, setCode] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ENABLE_ADSTERRA) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("value").eq("key", "adsterra_" + type).single();
      if (data && data.value) setCode(data.value);
      else if (FALLBACK_CODE[type]) setCode(FALLBACK_CODE[type]);
    })();
  }, [type]);

  useEffect(() => {
    if (!ENABLE_ADSTERRA || !code || !ref.current) return;
    ref.current.innerHTML = code;
    Array.from(ref.current.querySelectorAll("script")).forEach((old) => {
      const s = document.createElement("script");
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      if (old.textContent) s.textContent = old.textContent;
      ref.current?.appendChild(s);
    });
  }, [code]);

  if (!ENABLE_ADSTERRA || !code) return null;
  return <div ref={ref} className="my-3 flex justify-center overflow-hidden" />;
}