"use client";

import { useEffect } from "react";

const ONE_SIGNAL_APP_ID = "2873e8a6-070e-4bc4-91cb-123c7cd1c0ef";
const SAFARI_WEB_ID = "web.onesignal.auto.1881b8be-1ae3-4d80-a99d-32f491a07c07";

export default function OneSignalInit() {
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: ONE_SIGNAL_APP_ID,
        safari_web_id: SAFARI_WEB_ID, // This makes it work on iPhones!
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerParam: { scope: "/" },
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
        notifyButton: {
          enable: true,
          position: "bottom-right",
          size: "medium",
          theme: "default",
          showCredit: false,
          text: {
            "tip.state.unsubscribed": "🔔 Subscribe to updates",
            "tip.state.subscribed": "✅ You're subscribed!",
            "tip.state.blocked": "⚠️ Notifications blocked",
          },
        },
      });
    });

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return null;
}