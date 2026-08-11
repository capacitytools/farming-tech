"use client";

import { useEffect } from "react";

const ONE_SIGNAL_APP_ID = "2873e8a6-070e-4bc4-91cb-123c7cd1c0ef";

export default function OneSignalInit() {
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(function (OneSignal: any) {
      OneSignal.init({
        appId: ONE_SIGNAL_APP_ID,
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