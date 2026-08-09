"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ListingActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function setStatus(newStatus: string) {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("livestock_listings").update({ status: newStatus }).eq("id", id);
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex gap-2 mt-3">
      {status === "pending" && (
        <>
          <button onClick={() => setStatus("active")} disabled={busy} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold">✅ Approve</button>
          <button onClick={() => setStatus("rejected")} disabled={busy} className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-semibold">❌ Reject</button>
        </>
      )}
      {status === "active" && (
        <button onClick={() => setStatus("sold")} disabled={busy} className="flex-1 bg-gray-600 text-white py-2 rounded-xl text-sm font-semibold">Mark Sold</button>
      )}
    </div>
  );
}