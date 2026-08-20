"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function parseSource(ref: string, url: URL): string {
  const utm = url.searchParams.get("utm_source");
  if (utm) return utm.toLowerCase();
  const r = ref.toLowerCase();
  if (!r) return "direct";
  if (r.includes("wa.me") || r.includes("whatsapp")) return "whatsapp";
  if (r.includes("facebook") || r.includes("fb.")) return "facebook";
  if (r.includes("twitter") || r.includes("t.co")) return "x/twitter";
  if (r.includes("pinterest")) return "pinterest";
  if (r.includes("telegram") || r.includes("t.me")) return "telegram";
  if (r.includes("instagram")) return "instagram";
  if (r.includes("google")) return "google";
  if (r.includes(url.hostname)) return "internal";
  return "other";
}

function parseBrowser(ua: string): string {
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR")) return "Opera";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  return "Other";
}

function parseDevice(ua: string): string {
  if (ua.includes("iPad") || ua.includes("Tablet")) return "Tablet";
  if (ua.includes("Mobile") || ua.includes("Android")) return "Mobile";
  return "Desktop";
}

export default function VisitorTracker() {
  useEffect(() => {
    (async () => {
      try {
        if (sessionStorage.getItem("ftb_visit")) return;
        sessionStorage.setItem("ftb_visit", "1");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const url = new URL(window.location.href);
        const ref = document.referrer || "";
        let country = "Unknown";
        let city = "";
        try {
          const g = await fetch("https://ipapi.co/json/");
          const gj = await g.json();
          country = gj.country_name || "Unknown";
          city = gj.city || "";
        } catch {}
        await supabase.from("visits").insert({
          user_id: user?.id || null,
          path: url.pathname + (url.search || ""),
          referrer: ref.slice(0, 200),
          source: parseSource(ref, url),
          country,
          city,
          device: parseDevice(navigator.userAgent),
          browser: parseBrowser(navigator.userAgent),
          lang: navigator.language,
        });
      } catch {}
    })();
  }, []);
  return null;
}