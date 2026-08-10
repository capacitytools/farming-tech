"use client";

import { useEffect, useRef } from "react";

const ADS: any = {
  native: { src: "https://pl30772368.effectivecpmnetwork.com/cbcab21814fa3ee82a0060ff8b06de7e/invoke.js" },
  "banner-320": { key: "f6b4eadf878c297dddf13dca7f7c44dd", height: 50, width: 320 },
  "banner-300": { key: "3b3b5739d33d6816bdecaf628f570678", height: 250, width: 300 },
  "banner-468": { key: "b416467a3dadebe401b54d4b716d105e", height: 60, width: 468 },
  "banner-728": { key: "a74fb60bf43a8b46c2c76dd4844d79ff", height: 90, width: 728 },
};

export default function AdBanner({ type }: { type: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.childElementCount > 0) return;
    const cfg = ADS[type];
    if (!cfg) return;

    if (type === "native") {
      const container = document.createElement("div");
      container.id = "container-cbcab21814fa3ee82a0060ff8b06de7e";
      el.appendChild(container);
      const s = document.createElement("script");
      s.async = true;
      s.setAttribute("data-cfasync", "false");
      s.src = cfg.src;
      el.appendChild(s);
    } else {
      const opt = document.createElement("script");
      opt.text = `atOptions = { 'key': '${cfg.key}', 'format': 'iframe', 'height': ${cfg.height}, 'width': ${cfg.width}, 'params': {} };`;
      el.appendChild(opt);
      const s = document.createElement("script");
      s.src = `https://www.highperformanceformat.com/${cfg.key}/invoke.js`;
      el.appendChild(s);
    }
  }, [type]);

  return <div ref={ref} className="my-6 flex justify-center overflow-hidden" />;
}