"use client";

import { useEffect } from "react";

function injectScript(htmlString: string) {
  if (!htmlString) return;
  // Check if it has a src attribute
  const srcMatch = htmlString.match(/src="([^"]+)"/);
  if (srcMatch && srcMatch[1]) {
    const script = document.createElement("script");
    script.src = srcMatch[1];
    script.async = true;
    document.body.appendChild(script);
  } else if (htmlString.includes("<script")) {
    // If it has inline code, parse and inject
    const div = document.createElement("div");
    div.innerHTML = htmlString;
    const scripts = div.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const script = document.createElement("script");
      Array.from(scripts[i].attributes).forEach((attr) => {
        script.setAttribute(attr.name, attr.value);
      });
      script.text = scripts[i].innerHTML;
      document.body.appendChild(script);
    }
  }
}

export default function AdsterraInjector() {
  useEffect(() => {
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("admin_settings").select("*").eq("id", 1).single();
      if (data) {
        injectScript(data.adsterra_native_script);
        injectScript(data.adsterra_push_script);
        injectScript(data.adsterra_banner_script);
      }
    })();
  }, []);

  return null;
}