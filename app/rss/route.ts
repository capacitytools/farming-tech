import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function esc(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const supabase = createClient();
  const [{ data: blogs }, { data: books }] = await Promise.all([
    supabase.from("blogs").select("slug, title, content, cover_image_url, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("ebooks").select("id, title, description, cover_url, created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const items: any[] = [];
  (blogs || []).forEach((b: any) =>
    items.push({
      title: "🌾 " + (b.title || ""),
      desc: (b.content || "").slice(0, 300),
      img: b.cover_image_url || "",
      link: `https://farming-tech.vercel.app/blog/${b.slug}`,
      date: b.created_at,
    })
  );
  (books || []).forEach((b: any) =>
    items.push({
      title: "📚 " + (b.title || ""),
      desc: (b.description || "").slice(0, 300),
      img: b.cover_url || "",
      link: `https://farming-tech.vercel.app/ebooks/${b.id}`,
      date: b.created_at,
    })
  );
  items.sort((a, b) => (a.date < b.date ? 1 : -1));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>Farming Tech &amp; Business</title>
<link>https://farming-tech.vercel.app</link>
<description>Latest farming insights, blog posts & ebooks from Farming Tech & Business</description>
${items
  .map(
    (i) => `<item>
<title>${esc(i.title)}</title>
<link>${i.link}</link>
<guid>${i.link}</guid>
<description>${esc(i.desc)} ... Read more: ${i.link}</description>
<media:content url="${i.img}" medium="image"/>
<enclosure url="${i.img}" type="image/jpeg"/>
<pubDate>${new Date(i.date).toUTCString()}</pubDate>
</item>`
  )
  .join("")}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}