"use client";

import { useEffect, useRef } from "react";

export default function AdBanner({ type }: { type: "native" | "banner-320" | "banner-300" | "banner-468" | "banner-728" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    if (type === "native") {
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = "https://pl30772368.effectivecpmnetwork.com/cbcab21814fa3ee82a0060ff8b06de7e/invoke.js";
      ref.current.innerHTML = '<div id="container-cbcab21814fa3ee82a0060ff8b06de7e"></div>';
      ref.current.appendChild(script);
    } else if (type === "banner-320") {
      ref.current.innerHTML = `
        <script>
          atOptions = {
            'key' : 'f6b4eadf878c297dddf13dca7f7c44dd',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        </script>
        <script src="https://www.highperformanceformat.com/f6b4eadf878c297dddf13dca7f7c44dd/invoke.js"></script>
      `;
    } else if (type === "banner-300") {
      ref.current.innerHTML = `
        <script>
          atOptions = {
            'key' : '3b3b5739d33d6816bdecaf628f570678',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script src="https://www.highperformanceformat.com/3b3b5739d33d6816bdecaf628f570678/invoke.js"></script>
      `;
    }
  }, [type]);

  return <div ref={ref} className="my-6 flex justify-center" />;
}