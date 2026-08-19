"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PAYSTACK_PUBLIC_KEY = "pk_live_00573ba36a45a7fa73d358fee60ae30f5ce1dd49";

const DEFAULT_PLANS = [
  { id: "mtn500", service: "MTN Data", plan: "500MB", price: 350, cost: 300 },
  { id: "mtn1", service: "MTN Data", plan: "1GB", price: 550, cost: 480 },
  { id: "mtn2", service: "MTN Data", plan: "2GB", price: 1000, cost: 900 },
  { id: "airtel1", service: "Airtel Data", plan: "1GB", price: 500, cost: 430 },
  { id: "glo1", service: "Glo Data", plan: "1GB", price: 450, cost: 380 },
  { id: "9m1", service: "9mobile Data", plan: "1GB", price: 450, cost: 380 },
  { id: "airtime", service: "Airtime (any network)", plan: "1000 value", price: 980, cost: 950 },
  { id: "gotv", service: "GOTV", plan: "Jinja", price: 3900, cost: 3800 },
  { id: "dstv", service: "DSTV", plan: "Padi", price: 4400, cost: 4300 },
];

function loadScript(src: string) {
  return new Promise((res, rej) => {
    if ((window as any).PaystackPop) return res(true);
    const s = document.createElement("script");
    const t = setTimeout(() => rej(new Error("Paystack script timed out")), 10000);
    s.src = src;
    s.onload = () => { clearTimeout(t); res(true); };
    s.onerror = () => { clearTimeout(t); rej(new Error("Paystack script blocked or failed to load")); };
    document.body.appendChild(s);
  });
}

export default function BillsPage() {
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [service, setService] = useState("");
  const [planId, setPlanId] = useState("");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    const { data: cfg } = await supabase.from("settings").select("value").eq("key", "bill_plans").single();
    if (cfg && cfg.value) { try { setPlans(JSON.parse(cfg.value)); } catch {} }
    if (u) {
      const { data: o } = await supabase.from("bill_orders").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(10);
      setOrders(o || []);
    }  }

  useEffect(() => { load(); }, []);

  const services = Array.from(new Set(plans.map((p) => p.service)));
  const visible = plans.filter((p) => p.service === service);
  const chosen = plans.find((p) => p.id === planId);

  async function pay() {
    if (!user) return alert("Log in first so we can track your order.");
    if (!chosen) return alert("Choose a plan.");
    if (phone.replace(/\D/g, "").length < 11) return alert("Enter a valid phone number.");
    try {
      await loadScript("https://js.paystack.co/v1/inline.js");
      const pop = (window as any).PaystackPop;
      if (!pop || !pop.setup) throw new Error("PaystackPop not available on this browser");
      const handler = pop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: chosen.price * 100,
        ref: "bills-" + Date.now(),
        callback: function (resp: any) {
          (async () => {
            const supabase = createClient();
            await supabase.from("bill_orders").insert({
              user_id: user.id,
              customer_phone: phone,
              service: chosen.service,
              plan: chosen.plan,
              amount: chosen.price,
              cost: chosen.cost,
              ref: resp.reference,
              status: "pending",
            });
            setMsg("✅ Payment received! Your " + chosen.plan + " " + chosen.service + " will be delivered to " + phone + " within minutes.");
            setPlanId("");
            load();
          })();
        },
      });
      handler.openIframe();
    } catch (err: any) {
      alert("Payment error: " + (err && err.message ? err.message : "unknown error — screenshot this and send to admin"));
    }
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">📶 Bills & Data — cheaper than the market</h1>
      <p className="text-xs text-gray-500 mb-4">Buy data, airtime, cable TV & more at farmer-friendly prices. Pay with card/transfer/USSD, delivered to any number.</p>      {msg && <p className="text-xs font-bold text-green-700 mb-3">{msg}</p>}

      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1">1. Choose network / service</p>
          <div className="flex gap-2 flex-wrap">
            {services.map((s) => (
              <button key={s} onClick={() => { setService(s); setPlanId(""); }} className={`px-3 py-2 rounded-xl text-xs font-bold ${service === s ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>{s}</button>
            ))}
          </div>
        </div>
        {service && (
          <div>
            <p className="text-xs font-bold text-gray-600 mb-1">2. Choose plan</p>
            <div className="grid grid-cols-3 gap-2">
              {visible.map((p) => (
                <button key={p.id} onClick={() => setPlanId(p.id)} className={`p-2 rounded-xl text-center ${planId === p.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                  <p className="text-sm font-extrabold">{p.plan}</p>
                  <p className="text-[10px] font-bold">₦{p.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1">3. Phone number to receive it</p>
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="e.g. 08012345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button onClick={pay} className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold">
          {chosen ? `💳 Pay ₦${chosen.price.toLocaleString()} now` : "💳 Pay with Paystack"}
        </button>
        <p className="text-[9px] text-gray-400 text-center">Secured by Paystack · card, transfer & USSD accepted</p>
      </div>

      {orders.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">🧾 My recent orders</h2>
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="glass-card p-3 rounded-2xl flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-bold">{o.service} — {o.plan}</p>
                  <p className="text-[10px] text-gray-500">📞 {o.customer_phone} · ₦{o.amount.toLocaleString()}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${o.status === "fulfilled" ? "bg-green-100 text-green-700" : o.status === "refunded" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                  {o.status === "pending" ? "⏳ Processing" : o.status === "fulfilled" ? "✅ Delivered" : "↩️ Refunded"}
                </span>
              </div>
            ))}
          </div>        </div>
      )}
    </div>
  );
}