"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdsterraController() {
  const [cfg, setCfg] = useState<any>({ popunder: null, socialbar: null });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("key, value").in("key", ["adsterra_popunder", "adsterra_socialbar"]);
      const map: any = {};
      (data || []).forEach((r: any) => {
        try { map[r.key] = JSON.parse(r.value); } catch { map[r.key] = null; }
      });
      setCfg({ popunder: map["adsterra_popunder"] || null, socialbar: map["adsterra_socialbar"] || null });
    })();
  }, []);

  // WHEN ON: inject the scripts site-wide (once per visit)
  useEffect(() => {
    ["popunder", "socialbar"].forEach((k) => {
      const c = cfg[k];
      if (!c || !c.on || !c.code) return;
      const flag = "ftb_" + k;
      if ((window as any)[flag]) return;
      (window as any)[flag] = true;
      const holder = document.createElement("div");
      holder.style.display = "none";
      document.body.appendChild(holder);
      holder.innerHTML = c.code;
      Array.from(holder.querySelectorAll("script")).forEach((old) => {
        const s = document.createElement("script");
        Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
        if (old.textContent) s.textContent = old.textContent;
        document.body.appendChild(s);
      });
    });
  }, [cfg]);

  // WHEN OFF: hunt and destroy every adsterra trace on the page, forever
  useEffect(() => {
    const allOff = !cfg.popunder?.on && !cfg.socialbar?.on;
    if (!allOff) return;
    const kill = () => {
      document.querySelectorAll(
        "script[src*='effectivecpmnetwork'], script[src*='adsterra'], iframe[src*='effectivecpmnetwork'], iframe[src*='adsterra'], div[id^='container-'], div[class*='social-bar'], div[id*='popunder'], div[id*='push-notification']"
      ).forEach((el) => el.remove());
    };
    kill();
    const t = setInterval(kill, 3000);
    let obs: MutationObserver | null = null;
    if (document.body) {
      obs = new MutationObserver(kill);
      obs.observe(document.body, { childList: true, subtree: true });
    }
    return () => { clearInterval(t); if (obs) obs.disconnect(); };
  }, [cfg]);

  return null;
}