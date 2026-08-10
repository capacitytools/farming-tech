import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "No reference" }, { status: 400 });

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const json = await res.json();

  const supabase = createClient();
  if (json?.data?.status === "success") {
    await supabase.from("ebook_purchases").update({ status: "paid" }).eq("reference", reference);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, reason: json?.data?.gateway_response || "Payment not successful" });
}