'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ArticleEnginePage() {
  const [admin, setAdmin] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const [f, setF] = useState({
    topic: '', primaryKey: '', category: 'Farming', audience: 'Beginner farmers in Nigeria',
    region: 'Nigeria', author: 'Site Admin', productId: '', secondaryKw: '', questions: '',
    instructions: '', depth: 'standard', videoUrl: '',
  });
  
  const [intent, setIntent] = useState<{ intent: string; why: string } | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [seo, setSeo] = useState({ title: '', h1: '', meta: '', slug: '' });
  const [content, setContent] = useState('');
  const [cover, setCover] = useState('');
  const [faqText, setFaqText] = useState('');
  const [srcText, setSrcText] = useState('');
  const [indexable, setIndexable] = useState(true);
  const [status, setStatus] = useState('published');
  const [audit, setAudit] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [aiKey, setAiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [aiBusy, setAiBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin');
    }
    const [b, e] = await Promise.all([
      supabase.from('blogs').select('*').order('created_at', { ascending: false }),
      supabase.from('ebooks').select('id, title, price').order('created_at', { ascending: false }),    ]);
    setBlogs(b.data || []);
    setEbooks(e.data || []);
    setAiKey(localStorage.getItem('ftb_gemini_key') || '');
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function classify(t: string) {
    const s = t.toLowerCase();
    if (/(buy|price|cost|for sale|supplier|ebook|training fee|order)/.test(s)) return { intent: 'Transactional', why: 'The query contains purchase language, so the searcher is ready to act.' };
    if (/(best|vs|review|which|compare|top)/.test(s)) return { intent: 'Commercial investigation', why: 'The searcher is comparing options before deciding.' };
    if (/(near me|in nigeria|in lagos|in ibadan|around me)/.test(s)) return { intent: 'Local', why: 'The query carries location intent.' };
    if (/(how to|steps|guide|start|setup|build|make)/.test(s)) return { intent: 'Informational (How-To)', why: 'The searcher wants a practical procedure they can follow.' };
    if (/(what|why|meaning|causes|symptoms|deficiency)/.test(s)) return { intent: 'Informational', why: 'The searcher needs understanding before action.' };
    return { intent: 'Mixed intent', why: 'The query blends learning and decision-making.' };
  }

  function generate() {
    if (!f.topic.trim()) return alert('Enter the topic first.');
    const pk = (f.primaryKey || f.topic).trim().toLowerCase();
    const it = classify(f.topic + ' ' + pk);
    setIntent(it);
    
    const secondary = (f.secondaryKw ? f.secondaryKw.split(',').map((x) => x.trim()) : []).concat([
      pk + ' guide', pk + ' for beginners', pk + ' cost in ' + f.region, pk + ' problems and solutions',
    ]);
    
    const structure = it.intent.startsWith('Informational (How')
      ? ['Quick Answer', 'What You Need Before You Start', 'Step-by-Step Process', 'Costs & Budget Table', 'Common Mistakes to Avoid', 'FAQs', 'Conclusion & Next Steps']
      : ['Quick Answer', 'Key Takeaways', 'Core Explanation', 'Practical Examples', 'FAQs', 'Conclusion'];
      
    const cannib = blogs.filter((b) => ((b.primary_keyword || '').toLowerCase().includes(pk) || (b.title || '').toLowerCase().includes(pk)));
    const internal = blogs.filter((b) => b.category === f.category).slice(0, 4).map((b) => ({ title: b.title, url: '/blog/' + b.slug }));
    
    const title = (f.topic + ' - ' + f.region + ' Guide').slice(0, 60);
    const meta = (f.topic + ': practical steps, real costs and common mistakes for ' + f.audience.toLowerCase() + '.').slice(0, 158);
    const slug = slugify(f.topic);
    
    setSeo({ title, h1: f.topic, meta, slug });
    setAnalysis({ pk, secondary, structure, cannib, internal });
    flash('Analysis complete. Ready for AI Writer.');
  }
  async function writeWithAI() {
    if (!analysis) return alert('Run the analysis first.');
    let key = aiKey || localStorage.getItem('ftb_gemini_key') || '';
    if (!key) {
      const p = window.prompt('Paste your free Google Gemini API key (get it at aistudio.google.com/apikey):');
      if (!p) return;
      key = p.trim();
      localStorage.setItem('ftb_gemini_key', key);
      setAiKey(key);
    }
    
    setAiBusy(true);
    flash('AI writer is working... this takes 20-60 seconds.');
    
    const links = (analysis.internal || []).map((i: any) => '- ' + i.title + ' (' + i.url + ')').join('\n');
    
    // MASTER PROMPT SYSTEM INSTRUCTION
    const system = 'You are the senior agricultural writer for Farming Tech & Business. Rules: SEARCHER FIRST. Open with the answer or problem immediately. NEVER use AI filler like "In today\'s world", "delve", "unlock", or "embark". Use practical, farmer-friendly language. Use ## headings and markdown tables where they help. Wrap key terms in **bold**. Never fabricate personal experience; use "Farmers commonly..." or "Research indicates...". Include a "Quick Answer" section (40-100 words) and a "Key Takeaways" list.';
    
    const instructionText = 'Write a complete, publication-ready article now.\nTOPIC: ' + f.topic + '\nPRIMARY KEYWORD: ' + analysis.pk + '\nINTENT: ' + intent?.intent + ' (' + intent?.why + ')\nAUDIENCE: ' + f.audience + ' | REGION: ' + f.region + '\nSTRUCTURE: ' + analysis.structure.join(' -> ') + '\nINTERNAL LINKS (embed naturally): ' + links + '\nOUTPUT FORMAT:\n---ARTICLE---\n(full markdown)\n---FAQ---\nQuestion | Answer\n---SOURCES---\nTitle | Org | URL';
    
    // MODEL FALLBACK LOOP
    const models = [aiModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let text = '';
    let lastErr = '';
    
    for (let i = 0; i < models.length; i++) {
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + key, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ parts: [{ text: instructionText }] }],
          }),
        });
        const data = await res.json();
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) break;
        lastErr = data?.error?.message || 'empty response';
      } catch (err: any) {
        lastErr = err.message;
      }
    }
    
    if (!text) {
      alert('AI writer error: ' + lastErr);
      setAiBusy(false);
      return;
    }    
    const art = (text.split('---ARTICLE---')[1] || text).split('---FAQ---')[0].trim();
    const faqPart = text.split('---FAQ---')[1]?.split('---SOURCES---')[0]?.trim() || '';
    const srcPart = text.split('---SOURCES---')[1]?.trim() || '';
    
    setContent(art);
    setFaqText(faqPart);
    setSrcText(srcPart === 'none' ? '' : srcPart);
    auditNow(art, faqPart);
    flash('Article written and auto-filled!');
    setAiBusy(false);
  }

  function auditNow(c: string, fq: string) {
    const words = c.trim() ? c.trim().split(/\s+/).length : 0;
    const faqs = fq.split('\n').filter((l) => l.includes('|'));
    const checks = [
      { k: 'Search intent', ok: !!intent },
      { k: 'Primary keyword', ok: !!analysis?.pk },
      { k: 'SEO title (30-60)', ok: seo.title.length >= 30 && seo.title.length <= 60 },
      { k: 'Meta (70-160)', ok: seo.meta.length >= 70 && seo.meta.length <= 160 },
      { k: 'Clean URL', ok: /^[a-z0-9-]+$/.test(seo.slug) },
      { k: 'Depth (600+ words)', ok: words >= 600 },
      { k: 'Internal links', ok: (analysis?.internal?.length || 0) >= 1 },
      { k: 'FAQ (3+)', ok: faqs.length >= 3 },
      { k: 'Ebook CTA', ok: !!f.productId },
    ];
    setAudit(checks);
    setScore(checks.filter((x) => x.ok).length * 11);
  }

  async function uploadCoverFn(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCover(await uploadToCloudinary(file, 'blog-covers'));
    } catch (err: any) {
      alert('Upload failed');
    }
  }

  async function publish() {
    if (!seo.title.trim() || !content.trim()) return alert('Title and content required.');
    const supabase = createClient();
    const faqs = faqText.split('\n').filter((l) => l.includes('|')).map((l) => { const [q, a] = l.split('|'); return { q: q.trim(), a: a.trim() }; });
    const payload = {
      title: seo.h1 || seo.title, slug: seo.slug, content, category: f.category, cover_image_url: cover || null,
      meta_title: seo.title, meta_description: seo.meta, primary_keyword: analysis?.pk || '', search_intent: intent?.intent || '',
      author_name: f.author, status, indexable, faq_json: JSON.stringify(faqs), product_cta: f.productId || null,
    };    if (editId) await supabase.from('blogs').update(payload).eq('id', editId);
    else await supabase.from('blogs').insert(payload);
    flash('Published!');
    load();
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold">AI Article Engine</h1>
      {msg && <p className="text-xs font-bold text-green-700">{msg}</p>}

      <div className="glass-card p-4 rounded-2xl space-y-2">
        <input className="w-full p-2 rounded-xl border text-sm" placeholder="Topic" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} />
        <input className="w-full p-2 rounded-xl border text-sm" placeholder="Primary Keyword" value={f.primaryKey} onChange={(e) => setF({ ...f, primaryKey: e.target.value })} />
        <select className="w-full p-2 rounded-xl border text-sm" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          <option>Farming</option><option>Tech</option><option>Business</option>
        </select>
        <button onClick={generate} className="w-full bg-forest-600 text-white py-3 rounded-xl font-bold">1. Run Analysis</button>
      </div>

      {analysis && (
        <>
          <div className="glass-card p-4 rounded-2xl border-2 border-purple-400">
            <p className="text-xs font-bold mb-2">Intent: {intent?.intent}</p>
            <input className="w-full p-2 rounded-xl border text-xs mb-2" type="password" placeholder="Gemini API Key" value={aiKey} onChange={(e) => { setAiKey(e.target.value); localStorage.setItem('ftb_gemini_key', e.target.value); }} />
            <button onClick={writeWithAI} disabled={aiBusy} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold">
              {aiBusy ? 'Writing...' : '2. Write with AI (Auto-fill)'}
            </button>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-bold">SEO Pack</p>
            <input className="w-full p-2 rounded-xl border text-sm" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
            <textarea className="w-full p-2 rounded-xl border text-sm" rows={2} value={seo.meta} onChange={(e) => setSeo({ ...seo, meta: e.target.value })} />
            <input className="w-full p-2 rounded-xl border text-sm" value={seo.slug} onChange={(e) => setSeo({ ...seo, slug: slugify(e.target.value) })} />
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-bold">Content & Media</p>
            <label className="block text-xs font-bold text-green-700">Cover Image <input type="file" className="hidden" onChange={uploadCoverFn} /></label>
            <textarea className="w-full p-2 rounded-xl border text-xs font-mono" rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
            <select className="w-full p-2 rounded-xl border text-sm" value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
              <option value="">No Ebook CTA</option>
              {ebooks.map((eb) => <option key={eb.id} value={eb.id}>{eb.title}</option>)}
            </select>
          </div>
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-bold">FAQs & Sources (Auto-filled)</p>
            <textarea className="w-full p-2 rounded-xl border text-xs" rows={4} value={faqText} onChange={(e) => setFaqText(e.target.value)} />
            <textarea className="w-full p-2 rounded-xl border text-xs" rows={2} value={srcText} onChange={(e) => setSrcText(e.target.value)} />
          </div>

          <div className="glass-card p-4 rounded-2xl border-2 border-green-400">
            <p className="text-sm font-bold mb-2">Audit Score: {score}/100</p>
            {audit.map((c) => <p key={c.k} className={'text-xs ' + (c.ok ? 'text-green-700' : 'text-amber-600')}>{c.ok ? 'PASS' : 'REVIEW'} {c.k}</p>)}
            <button onClick={publish} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mt-4">3. Publish Article</button>
          </div>
        </>
      )}
    </div>
  );
}