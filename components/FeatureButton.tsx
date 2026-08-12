"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function FeatureButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function request() {
    if (!confirm("Feature this listing for ₦300 (7 days)? You'll pay via WhatsApp receipt and admin activates it.")) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("livestock_listings").update({ featured_requested: true }).eq("id", id);
    router.refresh();
    setBusy(false);
  }

  return (
    <button onClick={request} disabled={busy} className="mt-3 w-full py-2 rounded-xl font-semibold text-white bg-amber-500 disabled:opacity-50">
      ⭐ Feature for ₦300 (7 days)
    </button>
  );
}