"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BlogViewBumper({ id }: { id: string }) {
  useEffect(() => {
    const key = "blogview-" + id;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("blogs").select("views_count").eq("id", id).single();
      if (data) await supabase.from("blogs").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id);
    })();
  }, [id]);
  return null;
}