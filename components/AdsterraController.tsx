"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AD_DOMAINS = ["effectivecpmnetwork", "adsterra", "propellerads", "onclickads", "pushadvert", "cloudfront.net/ads"];

export default function AdsterraController() {
  const [cfg, setCfg] = useState<any>({ popunder: null, socialbar: null });
  const [onBlog, setOnBlog] = useState(false);

  useEffect(() => {
    setOnBlog(window.location.pathname.startsWith("/blog"));
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

  // WHEN ON BLOG + SWITCH ON: inject
  useEffect(() => {
    if (!onBlog) return;
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
  }, [cfg, onBlog]);

  // EVERYWHERE ELSE (or when OFF): hunt and destroy all ad traces forever
  useEffect(() => {
    const allowed = onBlog && (cfg.popunder?.on || cfg.socialbar?.on);
    if (allowed) return;
    const kill = () => {
      document.querySelectorAll("script, iframe, link, img").forEach((el) => {
        const src = ((el as any).src || (el as any).href || "") + "";
        if (AD_DOMAINS.some((d) => src.includes(d))) el.remove();
      });
      document.querySelectorAll("div[id^='container-'], div[class*='social-bar'], div[id*='popunder'], div[id*='push-wrap'], div[id*='adsterra']").forEach((el) => el.remove());
    };
    kill();
    const t = setInterval(kill, 1500);
    let obs: MutationObserver | null = null;
    if (document.body) {
      obs = new MutationObserver(kill);
      obs.observe(document.body, { childList: true, subtree: true });
    }
    return () => { clearInterval(t); if (obs) obs.disconnect(); };
  }, [cfg, onBlog]);

  return null;
}