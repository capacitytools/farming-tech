"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="glass-card p-4 rounded-2xl shadow-xl flex items-center gap-3">
        <span className="text-2xl">📱</span>
        <div className="flex-1">
          <p className="font-bold text-sm">Install Farming Tech App</p>
          <p className="text-xs text-gray-600">Fast access, works like a native app</p>
        </div>
        <button onClick={install} className="bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold">
          Install
        </button>
        <button onClick={() => setVisible(false)} className="text-gray-400 px-1">✕</button>
      </div>
    </div>
  );
}