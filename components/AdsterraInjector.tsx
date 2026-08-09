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

export default function AdsterraInjector() {
  const [ads, setAds] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("admin_settings").select("*").eq("id", 1).single();
      if (data) {
        setAds(data);
        injectInline(data.adsterra_native_script);
        injectInline(data.adsterra_push_script);
        injectInline(data.adsterra_banner_script);
      }
    })();
  }, []);

  const nativeSrc = extractSrc(ads?.adsterra_native_script);
  const bannerSrc = extractSrc(ads?.adsterra_banner_script);
  const pushSrc = extractSrc(ads?.adsterra_push_script);

  return (
    <>
      {nativeSrc && <Script src={nativeSrc} strategy="afterInteractive" />}
      {bannerSrc && <Script src={bannerSrc} strategy="afterInteractive" />}
      {pushSrc && <Script src={pushSrc} strategy="lazyOnload" />}
    </>
  );
}