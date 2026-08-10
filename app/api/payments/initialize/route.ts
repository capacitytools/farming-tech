import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { ebook_id } = await req.json();
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

    const { data: ebook } = await supabase.from("ebooks").select("*").eq("id", ebook_id).single();
    if (!ebook) return NextResponse.json({ error: "Ebook not found" }, { status: 404 });

    const reference = `FT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await supabase.from("ebook_purchases").insert({
      user_id: user.id,
      ebook_id: ebook.id,
      email: user.email,
      reference,
      amount: ebook.price,
      currency: ebook.currency,
    });

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(Number(ebook.price) * 100),
        currency: ebook.currency || "NGN",
        reference,
        callback_url: `https://farming-tech.vercel.app/ebooks?reference=${reference}`,
      }),
    });
    const json = await res.json();
    if (!json?.data?.authorization_url) {
      return NextResponse.json({ error: json?.message || "Initialize failed" }, { status: 502 });
    }
    return NextResponse.json({ url: json.data.authorization_url, reference });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}