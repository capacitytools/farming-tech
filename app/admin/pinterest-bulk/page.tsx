'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const PIN_W = 1000;
const PIN_H = 1500;
const PINS_PER_ARTICLE = 5;
const ARTICLES_PER_WEEK = 3; // 3 articles x 5 pins = 15 pins per week (Safe for Pinterest)

const PIN_STYLES = [
  { key: 'bold-band', build: (text: string) => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:0F3F1A,l_text:Arial_72_bold:' + encodeURIComponent(text) + ',co_white,g_south,y_120,w_900,c_fit' },
  { key: 'top-headline', build: (text: string) => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:0B1F14,l_text:Arial_68_bold:' + encodeURIComponent(text) + ',co_white,g_north,y_100,w_900,c_fit' },
  { key: 'center-card', build: (text: string) => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:F2C14E,l_text:Arial_64_bold:' + encodeURIComponent(text) + ',co_rgb:0B1F14,g_center,w_850,c_fit' },
  { key: 'clean-photo', build: () => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto' },
  { key: 'gold-frame', build: (text: string) => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:F2C14E,l_text:Arial_70_bold:' + encodeURIComponent(text) + ',co_rgb:0B1F14,g_south,y_140,w_880,c_fit' },
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
  const [weeks, setWeeks] = useState<any[][]>([]);
  const [msg, setMsg] = useState('');

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
      .not('cover_image_url', 'is', null)
      .order('created_at', { ascending: false });

    const allBlogs = b || [];
    setBlogs(allBlogs);

    // 🚨 CHUNK INTO WEEKS 🚨
    const chunkedWeeks = [];
    for (let i = 0; i < allBlogs.length; i += ARTICLES_PER_WEEK) {
      chunkedWeeks.push(allBlogs.slice(i, i + ARTICLES_PER_WEEK));
    }
    setWeeks(chunkedWeeks);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function getDescription(b: any) {
    const baseDesc = b.meta_description || b.excerpt || b.title;
    const hashtag = '#' + (b.primary_keyword || b.category || 'Farming').replace(/\s+/g, '');
    return `${baseDesc} \n\nSave this for later! 📌 Follow @FarmingTechBusiness for more ${b.category} tips.\n\n#FarmingNigeria #AgriTech ${hashtag}`;
  }

  function copyCSV(weekIndex: number) {
    const weekBlogs = weeks[weekIndex];
    const headers = ['Article Title', 'Article URL', 'Pin Style', 'Pin Image URL', 'Pin Description', 'Board Name'];
    const rows = [headers.join(',')];

    weekBlogs.forEach((b) => {
      const articleUrl = `https://www.farmingtechbusiness.com/blog/${b.slug}`;
      const boardName = b.category || 'Farming';
      const description = getDescription(b);

      PIN_STYLES.forEach((style) => {
        const pinUrl = buildPinUrl(b.cover_image_url, style.key, b.title.slice(0, 60));
        const cleanTitle = `"${b.title.replace(/"/g, '""')}"`;
        const cleanDesc = `"${description.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        rows.push([cleanTitle, articleUrl, style.key, pinUrl, cleanDesc, boardName].join(','));
      });
    });

    navigator.clipboard.writeText(rows.join('\n'));
    flash('CSV copied for Week ' + (weekIndex + 1) + '!');
  }

  function copyAIPrompt(weekIndex: number) {
    const weekBlogs = weeks[weekIndex];
    
    let promptText = `You are a world-class visual strategist and AI prompt engineer with 15 years of experience dominating Pinterest. 
I have ${weekBlogs.length} articles. I need you to generate 4 hyper-detailed, viral-optimized image generation prompts for EACH article (Vertical 2:3 for Pinterest). 
The prompts must follow these rules:
1. Absolute photorealism, 8k resolution, professional editorial photography.
2. Vary the styles: One bright/airy, one cinematic/moody, one close-up macro, one wide lifestyle shot.
3. BRANDING RULE: Leave natural negative space at the bottom for a logo. Do NOT generate text.
4. Output the prompts clearly separated by article.

Here are the articles for Week ${weekIndex + 1}:
`;

    weekBlogs.forEach((b, i) => {
      promptText += `\n--- ARTICLE ${i + 1} ---\nTitle: ${b.title}\nDescription: ${b.meta_description || b.excerpt || ''}\n`;
    });

    promptText += `\n\nPlease generate the prompts now.`;

    navigator.clipboard.writeText(promptText);
    flash('AI Prompt copied for Week ' + (weekIndex + 1) + '!');
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📌 Weekly Pinterest Planner</h1>
        <p className="text-xs text-gray-500">Batch your pins into weekly sprints to avoid getting flagged as spam.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl">
        <p className="text-xs font-bold text-amber-800">
          ⚠️ Pinterest Best Practice: Post 15-20 fresh pins per week. We grouped your articles into batches of {ARTICLES_PER_WEEK} articles ({ARTICLES_PER_WEEK * PINS_PER_ARTICLE} pins) per week.
        </p>
      </div>

      <div className="space-y-6">
        {weeks.map((weekBlogs, weekIndex) => (
          <div key={weekIndex} className="glass-card bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            
            {/* HEADER */}
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-forest-800">🗓️ Week {weekIndex + 1}</p>
                <p className="text-[10px] text-gray-500">{weekBlogs.length} articles • {weekBlogs.length * PINS_PER_ARTICLE} pins</p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => copyCSV(weekIndex)} className="flex-1 bg-red-600 text-white py-3 rounded-xl text-xs font-extrabold shadow-md active:scale-95">
                  📊 Copy CSV
                </button>
                <button onClick={() => copyAIPrompt(weekIndex)} className="flex-1 bg-purple-600 text-white py-3 rounded-xl text-xs font-extrabold shadow-md active:scale-95">
                  🪄 Copy AI Prompt
                </button>
              </div>
              
              <p className="text-[10px] text-gray-400 text-center">
                CSV for Tailwind/Sheets • AI Prompt for ChatGPT/Gemini image generation
              </p>

              {/* ARTICLE PREVIEWS */}
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                {weekBlogs.map(b => (
                  <div key={b.id} className="flex gap-2 items-center">
                    <img src={b.cover_image_url} alt="" className="w-8 h-8 rounded object-cover" />
                    <p className="text-[10px] font-bold text-gray-700 line-clamp-1">{b.title}</p>
                  </div>
                ))}
              </div>
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