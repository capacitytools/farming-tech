"use client";

export default function ShareBar({ url, title, image }: { url: string; title: string; image?: string }) {
  const e = encodeURIComponent;
  const text = `${title} — via Farming Tech & Business`;
  const open = (href: string) => window.open(href, "_blank", "width=640,height=520");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  }

  const btn = "flex-1 min-w-[70px] text-center py-2 rounded-xl text-xs font-bold text-white active:scale-95";

  return (
    <div className="flex flex-wrap gap-2 my-4">
      <button className={btn + " bg-green-600"} onClick={() => open(`https://wa.me/?text=${e(text + " " + url)}`)}>WhatsApp</button>
      <button className={btn + " bg-blue-600"} onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${e(url)}`)}>Facebook</button>
      <button className={btn + " bg-red-600"} onClick={() => open(`https://www.pinterest.com/pin/create/button/?url=${e(url)}${image ? `&media=${e(image)}` : ""}&description=${e(text)}`)}>📌 Pinterest</button>
      <button className={btn + " bg-sky-500"} onClick={() => open(`https://t.me/share/url?url=${e(url)}&text=${e(text)}`)}>Telegram</button>
      <button className={btn + " bg-gray-800"} onClick={() => open(`https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`)}>X</button>
      <button className={btn + " bg-gray-500"} onClick={copy}>Copy Link</button>
    </div>
  );
}