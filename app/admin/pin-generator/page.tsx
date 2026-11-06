'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Pinterest vertical pin spec: 1000 x 1500 (2:3 ratio)
const PIN_W = 1000;
const PIN_H = 1500;

// Curated overlay styles — each maps to a Cloudinary transformation stack
const PIN_STYLES = [
  {
    key: 'bold-band',
    label: '1. Bold Bottom Band',
    desc: 'Title on a solid forest-green band across the bottom third. Highest CTR style.',
    // Text overlay via Cloudinary: bottom band + white title text
    build: (text: string) =>
      'c_fill,w_' +
      PIN_W +
      ',h_' +
      PIN_H +
      ',g_auto,q_auto,f_auto/' +
      'co_rgb:0F3F1A,l_text:Arial_' +
      '72_bold:' +
      encodeURIComponent(text) +
      ',co_white,g_south,y_120,w_900,c_fit',
  },
  {
    key: 'top-headline',
    label: '2. Top Headline',
    desc: 'Title in a semi-transparent band at the top. Clean, editorial.',
    build: (text: string) =>
      'c_fill,w_' +
      PIN_W +
      ',h_' +
      PIN_H +
      ',g_auto,q_auto,f_auto/' +
      'co_rgb:0B1F14,l_text:Arial_68_bold:' +
      encodeURIComponent(text) +
      ',co_white,g_north,y_100,w_900,c_fit',
  },
  {
    key: 'center-card',
    label: '3. Center Card',
    desc: 'Title on a rounded pill in the middle. Great for Pinterest “screenshot” style.',
    build: (text: string) =>
      'c_fill,w_' +
      PIN_W +
      ',h_' +
      PIN_H +
      ',g_auto,q_auto,f_auto/' +
      'co_rgb:F2C14E,l_text:Arial_64_bold:' +
      encodeURIComponent(text) +
      ',co_rgb:0B1F14,g_center,w_850,c_fit',
  },
  {
    key: 'clean-photo',
    label: '4. Clean Photo',
    desc: 'No text overlay — you type the title in Pinterest itself. Best A/B baseline.',
    build: () =>
      'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto',
  },
  {
    key: 'gold-frame',
    label: '5. Gold Frame',
    desc: 'Title in a gold band, framed feel. Premium look for the FTB brand.',
    build: (text: string) =>
      'c_fill,w_' +
      PIN_W +
      ',h_' +
      PIN_H +
      ',g_auto,q_auto,f_auto/' +
      'co_rgb:F2C14E,l_text:Arial_70_bold:' +
      encodeURIComponent(text) +
      ',co_rgb:0B1F14,g_south,y_140,w_880,c_fit',
  },
];

function buildPinUrl(coverUrl: string, styleKey: string, title: string): string {
  if (!coverUrl || !coverUrl.includes('/upload/')) return '';
  const style = PIN_STYLES.find((s) => s.key === styleKey) || PIN_STYLES[0];
  const transform = style.build(title);
  return coverUrl.replace('/upload/', '/upload/' + transform + '/');
}

function truncate(s: string, n: number) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trim() + '…' : s;
}

export default function PinGeneratorPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [style, setStyle] = useState('bold-band');
  const [customTitle, setCustomTitle] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data: b } = await supabase
      .from('blogs')
      .select('id,title,slug,category,cover_image_url,cover_ratio,meta_description,excerpt,primary_keyword')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    setBlogs(b || []);
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function copy(t: string, label: string) {
    if (!t) {
      flash('Nothing to copy yet.');
      return;
    }
    navigator.clipboard.writeText(t);
    flash(label + ' copied!');
  }

  function pickBlog(b: any) {
    setSelected(b);
    setCustomTitle(truncate(b.meta_title || b.title || '', 60));
  }

  if (!loaded) return <p className="text-center p-10">Loading pin generator...</p>;
  if (!admin) return <p className="text-center p-10">Admin or Editor access only.</p>;

  const pinUrl = selected
    ? buildPinUrl(selected.cover_image_url, style, customTitle)
    : '';

  const description =
    selected
      ? (selected.meta_description || selected.excerpt || selected.title || '') +
        ' - Farming Tech & Business. #FarmingNigeria #AgriTech #' +
        (selected.primary_keyword || selected.category || 'Farming').replace(/\s+/g, '')
      : '';

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">📌 Pinterest Pin Generator</h1>
        <p className="text-xs text-gray-500">
          Turn any article into 5 Pinterest-ready vertical pins (1000x1500). Click, download, upload to Pinterest. Pinterest is a visual search engine - 5-10 pins per article per day.
        </p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-2">
        <p className="text-sm font-extrabold text-forest-700">1. PICK AN ARTICLE</p>
        <select
          className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
          value={selected?.id || ''}
          onChange={(e) => {
            const b = blogs.find((x) => x.id === e.target.value);
            if (b) pickBlog(b);
          }}
        >
          <option value="">- Select a published article -</option>
          {blogs.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
        {blogs.length === 0 && (
          <p className="text-[10px] text-amber-600">
            No published articles yet. Publish one from the Article Engine first.
          </p>
        )}
        {selected && (
          <p className="text-[10px] text-gray-500">
            Cover ratio: {selected.cover_ratio || '2:3'} • Category: {selected.category || 'N/A'}
          </p>
        )}
      </div>

      {selected && (
        <>
          {!selected.cover_image_url && (
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl">
              <p className="text-xs font-bold text-amber-800">
                ⚠️ This article has no cover image. Pin generator needs a Cloudinary-hosted cover.
              </p>
              <p className="text-[10px] text-amber-700 mt-1">
                Go to the Article Engine, upload a featured image, and re-publish.
              </p>
            </div>
          )}

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">2. OVERLAY TEXT</p>
            <textarea
              className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
              rows={2}
              placeholder="Short, punchy text for the pin (max 60 characters)"
              value={customTitle}
              onChange={(e) => setCustomTitle(truncate(e.target.value, 60))}
            />
            <p className="text-[9px] text-gray-400">
              {customTitle.length}/60 characters. Short and punchy beats long and clever. Pinterest scans in 0.2 seconds.
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">3. PICK A STYLE</p>
            {PIN_STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStyle(s.key)}
                className={
                  'w-full text-left p-3 rounded-xl border-2 transition ' +
                  (style === s.key
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-gray-200 bg-white/70')
                }
              >
                <p className="text-xs font-extrabold text-forest-800">{s.label}</p>
                <p className="text-[10px] text-gray-600">{s.desc}</p>
              </button>
            ))}
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">4. PREVIEW + DOWNLOAD</p>
            {pinUrl ? (
              <>
                <div className="bg-gray-100 rounded-2xl p-2 flex justify-center">
                  <img
                    src={pinUrl}
                    alt={customTitle || selected.title}
                    className="rounded-xl shadow-glass"
                    style={{ width: '100%', maxWidth: 320, aspectRatio: '2 / 3' }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 text-center">
                  1000 x 1500 px - Pinterest vertical pin spec
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={pinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={selected.slug + '-' + style + '.jpg'}
                    className="bg-forest-600 text-white py-3 rounded-xl font-extrabold text-xs text-center"
                  >
                    DOWNLOAD PIN
                  </a>
                  <button
                    onClick={() => copy(pinUrl, 'Pin image URL')}
                    className="bg-gray-700 text-white py-3 rounded-xl font-extrabold text-xs"
                  >
                    COPY IMAGE URL
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">
                Upload a cover image to this article first, then it will appear here.
              </p>
            )}
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">5. PIN DESCRIPTION</p>
            <textarea
              className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-xs"
              rows={4}
              readOnly
              value={description}
            />
            <p className="text-[9px] text-gray-400">
              {description.length}/500 characters. Pinterest allows 500 for descriptions - hashtags help discovery.
            </p>
            <button
              onClick={() => copy(description, 'Pin description')}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-extrabold text-xs"
            >
              COPY PIN DESCRIPTION
            </button>
            <Link
              href={
                'https://www.pinterest.com/pin-builder/?url=' +
                encodeURIComponent(
                  (typeof window !== 'undefined' ? window.location.origin : '') +
                    '/blog/' +
                    selected.slug
                ) +
                '&media=' +
                encodeURIComponent(pinUrl) +
                '&description=' +
                encodeURIComponent(description)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-red-500 text-white py-3 rounded-xl font-extrabold text-xs"
            >
              OPEN PINTEREST PIN BUILDER
            </Link>
            <p className="text-[9px] text-gray-400 text-center">
              Opens Pinterest pre-filled with your image, link and description. One tap to publish.
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">6. ALL 5 STYLES (batch)</p>
            <p className="text-[10px] text-gray-500">
              Generate all 5 pins for this article to A/B test on Pinterest. Download each, post to different boards.
            </p>
            {PIN_STYLES.map((s) => {
              const url = buildPinUrl(
                selected.cover_image_url,
                s.key,
                customTitle
              );
              return (
                <div key={s.key} className="flex items-center gap-2 bg-white/60 p-2 rounded-xl">
                  {url ? (
                    <img
                      src={url}
                      alt={s.label}
                      className="w-12 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 rounded-lg" />
                  )}
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-forest-800">{s.label}</p>
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={selected.slug + '-' + s.key + '.jpg'}
                      className="bg-forest-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold"
                    >
                      DOWNLOAD
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1">
            <p className="text-sm font-extrabold text-forest-700">📌 PINTEREST PLAYBOOK</p>
            <p className="text-[10px] text-gray-600">
              - Post 5-10 pins per day, not all at once.
            </p>
            <p className="text-[10px] text-gray-600">
              - Create themed boards: Poultry Nigeria, Maggot Farming, Farm Business, Goat Rearing...
            </p>
            <p className="text-[10px] text-gray-600">
              - Every pin links back to your article URL (already embedded in the builder link).
            </p>
            <p className="text-[10px] text-gray-600">
              - Pins live for months. A single good pin can drive traffic for 12+ months.
            </p>
            <p className="text-[10px] text-gray-600">
              - Use Tailwind (scheduler) once you have 50+ pins to save time.
            </p>
          </div>
        </>
      )}
    </div>
  );
}