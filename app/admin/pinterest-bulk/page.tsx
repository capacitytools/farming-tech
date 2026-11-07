'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const PIN_W = 1000;
const PIN_H = 1500;

const PIN_STYLES = [
  {
    key: 'bold-band',
    build: (text: string) => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:0F3F1A,l_text:Arial_72_bold:' + encodeURIComponent(text) + ',co_white,g_south,y_120,w_900,c_fit',
  },
  {
    key: 'top-headline',
    build: (text: string) => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:0B1F14,l_text:Arial_68_bold:' + encodeURIComponent(text) + ',co_white,g_north,y_100,w_900,c_fit',
  },
  {
    key: 'center-card',
    build: (text: string) => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:F2C14E,l_text:Arial_64_bold:' + encodeURIComponent(text) + ',co_rgb:0B1F14,g_center,w_850,c_fit',
  },
  {
    key: 'clean-photo',
    build: () => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto',
  },
  {
    key: 'gold-frame',
    build: (text: string) => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:F2C14E,l_text:Arial_70_bold:' + encodeURIComponent(text) + ',co_rgb:0B1F14,g_south,y_140,w_880,c_fit',
  },
];

function buildPinUrl(coverUrl: string, styleKey: string, title: string): string {
  if (!coverUrl || !coverUrl.includes('/upload/')) return '';
  const style = PIN_STYLES.find((s) => s.key === styleKey) || PIN_STYLES[0];
  return coverUrl.replace('/upload/', '/upload/' + style.build(title) + '/');
}

export default function BulkPinterestPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data: b } = await supabase
      .from('blogs')
      .select('id,title,slug,category,cover_image_url,meta_description,excerpt,primary_keyword')
      .eq('status', 'published')
      .not('cover_image_url', 'is', null) // Only grab ones with covers
      .order('created_at', { ascending: false });

    setBlogs(b || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function copyCSV() {
    const headers = ['Article Title', 'Article URL', 'Pin Style', 'Pin Image URL', 'Pin Description', 'Board Name'];
    const rows = [headers.join(',')];

    blogs.forEach((b) => {
      const articleUrl = `https://www.farmingtechbusiness.com/blog/${b.slug}`;
      const boardName = b.category || 'Farming';
      
      // Generate a strong description
      const baseDesc = b.meta_description || b.excerpt || b.title;
      const hashtag = '#' + (b.primary_keyword || b.category || 'Farming').replace(/\s+/g, '');
      const description = `${baseDesc} \n\nSave this for later! 📌 Follow @FarmingTechBusiness for more ${b.category} tips.\n\n#FarmingNigeria #AgriTech ${hashtag}`;

      PIN_STYLES.forEach((style) => {
        const pinUrl = buildPinUrl(b.cover_image_url, style.key, b.title.slice(0, 60));
        
        // Escape quotes for CSV
        const cleanTitle = `"${b.title.replace(/"/g, '""')}"`;
        const cleanDesc = `"${description.replace(/"/g, '""').replace(/\n/g, ' ')}"`;

        rows.push([
          cleanTitle,
          articleUrl,
          style.key,
          pinUrl,
          cleanDesc,
          boardName
        ].join(','));
      });
    });

    navigator.clipboard.writeText(rows.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📌 Bulk Pinterest Generator</h1>
        <p className="text-xs text-gray-500">Generate 5 Pinterest pins for every published article instantly.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border-2 border-red-500 bg-red-50 text-center space-y-4">
        <div>
          <p className="text-sm font-extrabold text-red-900">Ready to export?</p>
          <p className="text-xs text-red-700 mt-1">You have <strong className="text-lg">{blogs.length}</strong> articles with images. This will generate <strong className="text-lg">{blogs.length * 5}</strong> Pins.</p>
        </div>
        
        <button onClick={copyCSV} className="w-full bg-red-600 text-white py-4 rounded-xl font-extrabold text-sm shadow-lg active:scale-95 transition-transform">
          {copied ? '✅ COPIED TO CLIPBOARD!' : '📋 COPY ALL AS CSV'}
        </button>
        <p className="text-[10px] text-red-600">Paste this into Google Sheets or Excel. The columns are: Title, URL, Style, Image URL, Description, Board.</p>
      </div>

      {/* PREVIEW LIST */}
      <div className="space-y-3">
        <p className="text-sm font-extrabold text-forest-700">Preview (First 3 Articles)</p>
        {blogs.slice(0, 3).map((b) => (
          <div key={b.id} className="glass-card p-4 rounded-2xl bg-white border border-gray-100">
            <p className="text-sm font-bold text-forest-900 line-clamp-1">{b.title}</p>
            <p className="text-[10px] text-gray-500 mt-1 mb-3">Category: {b.category || 'None'}</p>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {PIN_STYLES.map(s => {
                const url = buildPinUrl(b.cover_image_url, s.key, b.title.slice(0, 60));
                return url ? (
                  <img key={s.key} src={url} alt={s.key} className="w-16 h-24 object-cover rounded-md border border-gray-200 shadow-sm" />
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/admin" className="text-xs font-bold text-forest-600 hover:underline">← Back to Admin Console</Link>
      </div>
    </div>
  );
}