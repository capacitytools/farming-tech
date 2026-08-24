"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("ebook_purchases")
      .select("*, profiles(full_name, email, whatsapp), ebooks(title, price, currency)")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) =>
    ((r.profiles?.full_name || "") + (r.profiles?.email || "") + (r.ebooks?.title || "")).toLowerCase().includes(q.toLowerCase())
  );
  const paidCount = rows.filter((r) => Number(r.ebooks?.price) > 0).length;
  const freeCount = rows.length - paidCount;
  const revenue = rows.reduce((s, r) => s + (Number(r.ebooks?.price) > 0 ? Number(r.ebooks.price) : 0), 0);

  function exportCSV() {
    const lines = ["Name,Email,WhatsApp,Book,Type,Amount (NGN),Date"];
    filtered.forEach((r) =>
      lines.push([
        '"' + (r.profiles?.full_name || "").replace(/"/g, "'") + '"',
        r.profiles?.email || "",
        r.profiles?.whatsapp || "",
        '"' + (r.ebooks?.title || "").replace(/"/g, "'") + '"',
        Number(r.ebooks?.price) > 0 ? "PAID" : "FREE",
        Number(r.ebooks?.price || 0),
        new Date(r.created_at).toLocaleString(),
      ].join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ftb-customers.csv";
    a.click();
  }
  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading customers…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">📇 Customer Spreadsheet</h1>
      <p className="text-xs text-gray-500 mb-4">Everyone who bought or downloaded a book — name, email, WhatsApp & the exact book. Export to Excel anytime.</p>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{rows.length}</p><p className="text-[8px] text-gray-500 font-bold">Customers</p></div>
        <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-green-700">{paidCount}</p><p className="text-[8px] text-gray-500 font-bold">Paid</p></div>
        <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-amber-600">{freeCount}</p><p className="text-[8px] text-gray-500 font-bold">Free</p></div>
        <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">₦{revenue.toLocaleString()}</p><p className="text-[8px] text-gray-500 font-bold">Revenue</p></div>
      </div>

      <div className="flex gap-2 mb-3">
        <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Search name, email or book..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={exportCSV} className="bg-forest-600 text-white px-4 rounded-xl text-sm font-bold">📥 CSV</button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-forest-700 text-white">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">WhatsApp</th>
                <th className="p-2">Book</th>
                <th className="p-2">Type</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 align-top">
                  <td className="p-2 font-bold">{r.profiles?.full_name || "—"}</td>
                  <td className="p-2 text-gray-600">{r.profiles?.email || "—"}</td>
                  <td className="p-2">{r.profiles?.whatsapp ? <a className="text-green-700 font-bold" href={`https://wa.me/${r.profiles.whatsapp}`} target="_blank" rel="noopener noreferrer">{r.profiles.whatsapp}</a> : "—"}</td>
                  <td className="p-2">{r.ebooks?.title || "—"}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full font-extrabold ${Number(r.ebooks?.price) > 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {Number(r.ebooks?.price) > 0 ? "PAID" : "FREE"}
                    </span>
                  </td>
                  <td className="p-2 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No customers yet — share a book link and watch them fill in.</td></tr>
              )}            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[9px] text-gray-400 mt-2">Tap any WhatsApp number to chat that customer directly. CSV opens in Excel / Google Sheets.</p>
    </div>
  );
}