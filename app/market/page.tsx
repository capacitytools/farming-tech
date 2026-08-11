import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { currencySymbol } from "@/lib/currency";

export default async function MarketPage(props: any) {
  const searchParams = await props.searchParams;
  const q = (searchParams?.q || "").trim();
  const cat = searchParams?.cat || "";
  const sort = searchParams?.sort || "new";

  const supabase = createClient();

  let query = supabase
    .from("livestock_listings")
    .select("*, tribes(name, icon), profiles(full_name, verified)")
    .eq("status", "active");
  if (q) query = query.ilike("title", `%${q}%`);
  if (cat) query = query.or(`tribes.name.eq.${cat},custom_category.eq.${cat}`);
  if (sort === "low") query = query.order("price", { ascending: true });
  else if (sort === "high") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data: listings } = await query;
  const { data: tribes } = await supabase.from("tribes").select("name, icon").order("name");

  let sorted = listings || [];
  if (sort === "new") {
    sorted = [...sorted].sort((a: any, b: any) => (b.profiles?.verified ? 1 : 0) - (a.profiles?.verified ? 1 : 0));
  }

  function href(over: any) {
    const p = new URLSearchParams();
    const nq = over.q !== undefined ? over.q : q;
    const ncat = over.cat !== undefined ? over.cat : cat;
    const nsort = over.sort !== undefined ? over.sort : sort;
    if (nq) p.set("q", nq);
    if (ncat) p.set("cat", ncat);
    if (nsort !== "new") p.set("sort", nsort);
    const s = p.toString();
    return "/market" + (s ? `?${s}` : "");
  }

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${active ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">🛒 Marketplace</h1>
        <Link href="/market/new" className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm">➕ Sell Now</Link>
      </div>

      <form action="/market" method="get" className="flex gap-2 mb-4">
        <input name="q" defaultValue={q} placeholder="Search animals, goods, feeds..." className="flex-1 p-3 rounded-xl border border-gray-200 bg-white/70" />
        {cat && <input type="hidden" name="cat" value={cat} />}
        {sort !== "new" && <input type="hidden" name="sort" value={sort} />}
        <button className="bg-green-600 text-white px-4 rounded-xl font-semibold">🔍</button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        <Link href={href({ cat: "" })} className={chip(cat === "")}>All</Link>
        {(tribes || []).map((t: any) => (
          <Link key={t.name} href={href({ cat: t.name })} className={chip(cat === t.name)}>
            {t.icon} {t.name}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-5 text-xs font-bold">
        <Link href={href({ sort: "new" })} className={chip(sort === "new")}>🆕 Newest</Link>
        <Link href={href({ sort: "low" })} className={chip(sort === "low")}>💲 Price: Low → High</Link>
        <Link href={href({ sort: "high" })} className={chip(sort === "high")}>💰 Price: High → Low</Link>
      </div>

      <p className="text-xs text-gray-500 mb-3">{sorted.length} results · ✅ = verified seller (shown first)</p>

      <div className="grid grid-cols-2 gap-3">
        {sorted.map((l: any) => (
          <Link key={l.id} href={`/market/${l.id}`} className="glass-card p-3 rounded-2xl active:scale-[0.98] transition-transform">
            {l.images?.[0] ? (
              <img src={l.images[0]} alt={l.title} className="w-full h-28 object-cover rounded-xl mb-2" />
            ) : (
              <div className="w-full h-28 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">🐄</div>
            )}
            <p className="font-semibold text-xs line-clamp-1">{l.title}</p>
            <p className="text-[10px] text-gray-500 line-clamp-1">
              {l.tribes ? `${l.tribes.icon} ${l.tribes.name}` : `🧺 ${l.custom_category}`} · {l.profiles?.full_name} {l.profiles?.verified && "✅"}
            </p>
            <p className="text-sm font-bold text-green-700 mt-1">{currencySymbol(l.currency)}{Number(l.price).toLocaleString()}</p>
          </Link>
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-10">No listings match your search.<br />Try another keyword or category.</p>
      )}
    </div>
  );
}