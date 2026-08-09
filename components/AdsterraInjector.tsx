"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

function extractSrc(html?: string | null): string | null {
  if (!html) return null;
  const m = html.match(/src="([^"]+)"/);
  return m ? m[1] : null;
}

function injectInline(html?: string | null) {
  if (!html || extractSrc(html)) return;
  if (!html.includes("<script")) return;
  const div = document.createElement("div");
  div.innerHTML = html;
  const scripts = div.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    const s = document.createElement("script");
    Array.from(scripts[i].attributes).forEach((a) => s.setAttribute(a.name, a.value));
    s.text = scripts[i].innerHTML;
    document.body.appendChild(s);
  }
}

// Popunder rules: only returning users, max 2 per day. New users = none.
function popunderAllowed(): boolean {
  try {
    const today = new Date().toDateString();

    // Track the very first visit
    const firstVisit = localStorage.getItem("ft_first_visit");
    if (!firstVisit) {
      localStorage.setItem("ft_first_visit", today);
      return false; // brand-new user -> no popunder
    }
    const isReturning = firstVisit !== today;
    if (!isReturning) return false; // first visit was today -> still new

    // Daily cap of 2
    let rec: { date: string; count: number } = { date: today, count: 0 };
    const raw = localStorage.getItem("ft_pop_daily");
    if (raw) {
      try {
        rec = JSON.parse(raw);
      } catch {}
    }
    if (rec.date !== today) rec = { date: today, count: 0 };
    if (rec.count >= 2) return false; // already shown 2x today

    rec.count += 1;
    localStorage.setItem("ft_pop_daily", JSON.stringify(rec));
    return true;
  } catch {
    return false;
  }
}

export default function AdsterraInjector() {
  const [ads, setAds] = useState<any>(null);
  const [allowPop, setAllowPop] = useState(false);

  useEffect(() => {
    setAllowPop(popunderAllowed());

    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("admin_settings").select("*").eq("id", 1).single();
      if (data) {
        setAds(data);
        injectInline(data.adsterra_native_script);
        injectInline(data.adsterra_banner_script);
      }
    })();
  }, []);

  // Inline popunder only when allowed
  useEffect(() => {
    if (allowPop && ads) injectInline(ads.adsterra_push_script);
  }, [allowPop, ads]);

  const nativeSrc = extractSrc(ads?.adsterra_native_script);
  const bannerSrc = extractSrc(ads?.adsterra_banner_script);
  const pushSrc = allowPop ? extractSrc(ads?.adsterra_push_script) : null;

  return (
    <>
      {nativeSrc && <Script src={nativeSrc} strategy="afterInteractive" />}
      {bannerSrc && <Script src={bannerSrc} strategy="afterInteractive" />}
      {pushSrc && <Script src={pushSrc} strategy="lazyOnload" />}
    </>
  );
}