"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SoldButton({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    setBusy(true);
    const supabase = createClient();
    const next = status === "sold" ? "active" : "sold";
    await supabase.from("livestock_listings").update({ status: next }).eq("id", id);
    router.refresh();
    setBusy(false);
  }

  return (
    <button onClick={toggle} disabled={busy} className={`mt-3 w-full py-2 rounded-xl font-semibold text-white disabled:opacity-50 ${status === "sold" ? "bg-green-600" : "bg-gray-700"}`}>
      {status === "sold" ? "🔄 Put Back on Market" : "✅ Mark as Sold"}
    </button>
  );
}