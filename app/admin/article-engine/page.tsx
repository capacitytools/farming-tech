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
  const [aiModel, setAiModel] = useState('gemini-flash-latest');
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

  function copy(t: string, label: string) {
    navigator.clipboard.writeText(t);
    flash(label + ' copied!');
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
      : it.intent === 'Transactional'
        ? ['Quick Answer', 'What You Get', 'How It Works', 'Pricing & Options', 'Who It Is For', 'FAQs', 'Get Started']
        : ['Quick Answer', 'Key Takeaways', 'Core Explanation', 'Practical Examples & Tables', 'Common Misconceptions', 'FAQs', 'Conclusion'];

    const cannib = blogs.filter((b) => ((b.primary_keyword || '').toLowerCase().includes(pk) || (b.title || '').toLowerCase().includes(pk)));
    const internal = blogs.filter((b) => b.category === f.category && b.slug !== slugify(f.topic)).slice(0, 4).map((b) => ({ title: b.title, url: '/blog/' + b.slug }));

    const title = (f.topic + ' - ' + f.region + ' Guide').slice(0, 60);
    const meta = (f.topic + ': practical steps, real costs and common mistakes for ' + f.audience.toLowerCase() + '. Clear guidance from Farming Tech & Business.').slice(0, 158);    const slug = slugify(f.topic);

    setSeo({ title, h1: f.topic, meta, slug });
    setAnalysis({ pk, secondary, structure, cannib, internal });
    flash('Analysis complete. Ready for the AI writer.');
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
    flash('AI writer is working... 20-60 seconds.');

    const links = (analysis.internal || []).map((i: any) => '- ' + i.title + ' (' + i.url + ')').join('\n');

    const system = 'You are the senior agricultural writer of Farming Tech & Business (Nigeria). Rules: SEARCHER FIRST. Open with the answer or the problem immediately. NEVER use AI filler like "In today\'s world...", "delve", "unlock", "embark", "game-changing". Include a ## Quick Answer of 40-100 words and ## Key Takeaways with 3-7 bullets. Use ## and ### headings, markdown tables where they genuinely help, and wrap key terms and numbers in **double asterisks** for bold. Short mobile-friendly paragraphs. Never fabricate personal experience, dosages or citations - use transparent language like "Farmers commonly...", "Research indicates...", "Estimates vary...". Add a ## FAQs section with 5-7 genuinely useful ### questions. End with ## Conclusion and a ## Continue Learning bullet list. Write original, practical, farmer-friendly English.';

    const instructionText = 'Write a complete, publication-ready article now.\nBRIEF:\nTopic: ' + f.topic + '\nPrimary keyword: ' + analysis.pk + '\nSecondary keywords: ' + analysis.secondary.join(', ') + '\nQuestions to answer: ' + (f.questions || analysis.pk + ' basics') + '\nSearch intent: ' + (intent ? intent.intent + ' - ' + intent.why : '') + '\nAudience: ' + f.audience + ' | Region: ' + f.region + ' | Depth: ' + f.depth + '\nStructure: ' + analysis.structure.join(' -> ') + '\nINTERNAL LINKS - embed 2 to 4 naturally as markdown links [anchor](url):\n' + (links || '(none yet)') + '\n' + (f.instructions ? 'SPECIAL INSTRUCTIONS: ' + f.instructions + '\n' : '') + 'OUTPUT FORMAT - use these exact markers on their own lines:\n---ARTICLE---\n(full markdown article, start with a 2-3 sentence intro, no H1)\n---FAQ---\nQuestion | Answer\n(one per line, 5-7 lines)\n---SOURCES---\nTitle | Organization | URL\n(only real verifiable sources; if none write exactly: none)';

    const models = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', aiModel];
    let text = '';
    const errs: string[] = [];

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
        errs.push(models[i] + ': ' + (data?.error?.message || 'empty response'));
      } catch (err: any) {
        errs.push(models[i] + ': ' + (err && err.message ? err.message : 'network error'));
      }
    }
    if (!text) {
      alert('AI writer tried all models:\n' + errs.join('\n'));
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
    flash('Article written, formatted and auto-filled!');
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
      { k: 'Featured image', ok: !!cover },
      { k: 'FAQ (3+)', ok: faqs.length >= 3 },
      { k: 'Ebook CTA', ok: !!f.productId },
    ];
    setAudit(checks);
    setScore(checks.filter((x) => x.ok).length * 10);
  }

  function runAudit() {
    auditNow(content, faqText);
  }

  function buildSchema() {
    const faqs = faqText.split('\n').filter((l) => l.includes('|')).map((l) => {
      const parts = l.split('|');
      return { q: (parts[0] || '').trim(), a: (parts[1] || '').trim() };
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const schema: any = {
      '@context': 'https://schema.org',
      '@graph': [        {
          '@type': 'BlogPosting',
          'headline': seo.h1 || seo.title,
          'description': seo.meta,
          'mainEntityOfPage': origin + '/blog/' + seo.slug,
          'author': { '@type': 'Person', 'name': f.author },
          'datePublished': new Date().toISOString(),
          'publisher': { '@type': 'Organization', 'name': 'Farming Tech & Business' },
        },
        {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': origin + '/' },
            { '@type': 'ListItem', 'position': 2, 'name': f.category, 'item': origin + '/blog' },
            { '@type': 'ListItem', 'position': 3, 'name': seo.h1 || seo.title, 'item': origin + '/blog/' + seo.slug },
          ],
        },
      ],
    };
    if (faqs.length) {
      schema['@graph'].push({
        '@type': 'FAQPage',
        'mainEntity': faqs.map((x) => ({ '@type': 'Question', 'name': x.q, 'acceptedAnswer': { '@type': 'Answer', 'text': x.a } })),
      });
    }
    return JSON.stringify(schema, null, 2);
  }

  function socialPack() {
    const url = (typeof window !== 'undefined' ? window.location.origin : '') + '/blog/' + seo.slug;
    const tag = '#' + f.category.replace(/\s/g, '');
    return {
      fb: '🌾 ' + seo.h1 + '\n\nPractical, field-ready guidance for ' + f.audience.toLowerCase() + ' - costs, steps and the mistakes to avoid.\n\nRead free: ' + url + '\n#FarmingTechAndBusiness ' + tag,
      ig: seo.h1 + ' 🌾\n\nEverything ' + f.audience.toLowerCase() + ' need to know - in one clear guide.\n\nLink in bio 🔗\n\n#FarmingTechAndBusiness #AgriTech ' + tag + ' #FarmingNigeria',
      x: seo.h1 + ' - a clear, practical guide for ' + f.audience.toLowerCase() + '.\n\n' + url + '\n\n#AgriTech ' + tag,
      li: seo.h1 + '\n\nA practical, source-aware guide for ' + f.audience.toLowerCase() + ' in ' + f.region + ': steps, costs, common mistakes and next steps.\n\n' + url + '\n\n#Agriculture #AgriTech #Business',
      pin: seo.h1 + ' | Farming Tech & Business - practical guide for ' + f.audience.toLowerCase() + '. ' + url,
    };
  }

  function imagePrompt() {
    return 'Photorealistic Nigerian farm scene illustrating "' + f.topic + '", golden hour, vertical 2:3, deep green and gold palette, educational composition, no text overlays - Farming Tech & Business visual identity.';
  }

  async function uploadCoverFn(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCover(await uploadToCloudinary(file, 'blog-covers'));
    } catch (err: any) {      alert('Upload failed');
    }
  }

  async function publish() {
    if (!seo.title.trim() || !content.trim()) return alert('Title and content required.');
    if (score < 60 && !window.confirm('Editorial score is ' + score + '/100 (below 60). Publish anyway?')) return;
    const supabase = createClient();
    const faqs = faqText.split('\n').filter((l) => l.includes('|')).map((l) => { const parts = l.split('|'); return { q: (parts[0] || '').trim(), a: (parts[1] || '').trim() }; });
    const srcs = srcText.split('\n').filter((l) => l.includes('|')).map((l) => { const parts = l.split('|'); return { title: (parts[0] || '').trim(), org: (parts[1] || '').trim(), url: (parts[2] || '').trim() }; });
    const payload = {
      title: seo.h1 || seo.title,
      slug: seo.slug,
      content: content,
      category: f.category,
      cover_image_url: cover || null,
      meta_title: seo.title,
      meta_description: seo.meta,
      excerpt: seo.meta,
      primary_keyword: analysis?.pk || f.primaryKey || '',
      secondary_keywords: (analysis?.secondary || []).join(', '),
      search_intent: intent ? intent.intent : '',
      topic_cluster: f.category,
      author_name: f.author,
      status: status,
      indexable: indexable,
      schema_json: buildSchema(),
      faq_json: JSON.stringify(faqs),
      sources_json: JSON.stringify(srcs),
      video_url: f.videoUrl || null,
      product_cta: f.productId || null,
      updated_at: new Date().toISOString(),
    };
    if (editId) await supabase.from('blogs').update(payload).eq('id', editId);
    else await supabase.from('blogs').insert(payload);
    flash('Published with full SEO pack! Score: ' + score + '/100');
    load();
  }

  if (!loaded) return <p className="text-center p-10">Loading engine...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  const social = analysis ? socialPack() : null;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">AI Article & SEO Engine</h1>
        <p className="text-xs text-gray-500">Research - intent - keywords - AI writes - auto-fill - audit - publish.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}      </div>

      <div className="glass-card p-4 rounded-2xl space-y-2">
        <p className="text-sm font-extrabold text-forest-700">1. ARTICLE BRIEF</p>
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Topic * (e.g. How to Start Maggot Farming)" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} />
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Primary keyword (auto = topic)" value={f.primaryKey} onChange={(e) => setF({ ...f, primaryKey: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <select className="p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            <option>Farming</option><option>Tech</option><option>Business</option>
          </select>
          <input className="p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Region" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} />
          <input className="p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Author" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} />
          <select className="p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={f.depth} onChange={(e) => setF({ ...f, depth: e.target.value })}>
            <option value="quick">Quick (800w)</option>
            <option value="standard">Standard (1500w)</option>
            <option value="pillar">Pillar (3000w+)</option>
          </select>
        </div>
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Target audience" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} />
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Secondary keywords (comma separated, optional)" value={f.secondaryKw} onChange={(e) => setF({ ...f, secondaryKw: e.target.value })} />
        <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder="Questions to answer (one per line, optional)" value={f.questions} onChange={(e) => setF({ ...f, questions: e.target.value })} />
        <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder="Special instructions (optional)" value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} />
        <button onClick={generate} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold">RUN INTENT + KEYWORD + GAP ANALYSIS</button>
      </div>

      {analysis && (
        <>
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">2. ANALYSIS</p>
            <p className="text-xs"><b>Intent:</b> {intent?.intent} - <i>{intent?.why}</i></p>
            <p className="text-xs"><b>Secondary:</b> {analysis.secondary.join(', ')}</p>
            <p className="text-xs"><b>Structure:</b> {analysis.structure.join(' > ')}</p>
            {analysis.cannib.length > 0 && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl">CANNIBALIZATION WARNING: similar articles exist: {analysis.cannib.map((c: any) => c.title).join('; ')} - consider updating them instead.</p>
            )}
            <p className="text-xs"><b>Internal links:</b> {analysis.internal.length ? analysis.internal.map((i: any) => i.title).join(', ') : 'none yet'}</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2 border-2 border-purple-400">
            <p className="text-sm font-extrabold text-purple-700">IN-HOUSE AI WRITER</p>
            <div className="flex gap-2">
              <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" type="password" placeholder="Gemini API key (free at aistudio.google.com/apikey)" value={aiKey} onChange={(e) => { setAiKey(e.target.value); localStorage.setItem('ftb_gemini_key', e.target.value); }} />
              <select className="p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
                <option value="gemini-flash-latest">flash-latest</option>
                <option value="gemini-2.5-flash">2.5-flash</option>
                <option value="gemini-2.0-flash">2.0-flash</option>
              </select>
            </div>
            <button onClick={writeWithAI} disabled={aiBusy} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-extrabold disabled:opacity-50">
              {aiBusy ? 'Writing & formatting your article...' : 'WRITE THE ARTICLE WITH AI (auto-fills everything)'}            </button>
            <p className="text-[9px] text-gray-400">Embeds internal links, bolds key terms, builds tables and FAQs, then fills content, FAQ and source panels automatically. Tries gemini-flash-latest first, then falls back automatically.</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">3. SEO PACK</p>
            <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
            <p className="text-[9px] text-gray-400">SEO title ({seo.title.length}/60)</p>
            <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={seo.h1} onChange={(e) => setSeo({ ...seo, h1: e.target.value })} />
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} value={seo.meta} onChange={(e) => setSeo({ ...seo, meta: e.target.value })} />
            <p className="text-[9px] text-gray-400">Meta description ({seo.meta.length}/160)</p>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">/blog/</span>
              <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={seo.slug} onChange={(e) => setSeo({ ...seo, slug: slugify(e.target.value) })} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy(buildSchema(), 'Schema')} className="flex-1 bg-gray-800 text-white py-2 rounded-xl text-xs font-bold">Copy Schema</button>
              <button onClick={() => copy('Home > ' + f.category + ' > ' + seo.h1, 'Breadcrumbs')} className="flex-1 bg-gray-600 text-white py-2 rounded-xl text-xs font-bold">Copy Breadcrumbs</button>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">4. CONTENT + MEDIA + CTA</p>
            <div className="flex gap-2">
              <button onClick={() => copy(content, 'Article')} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">Copy Article</button>
              <button onClick={() => copy(faqText, 'FAQ')} className="flex-1 bg-teal-600 text-white py-2 rounded-xl text-xs font-bold">Copy FAQ</button>
              <button onClick={() => copy(srcText, 'Sources')} className="flex-1 bg-gray-600 text-white py-2 rounded-xl text-xs font-bold">Copy Sources</button>
            </div>
            <button onClick={() => copy(imagePrompt(), 'Image prompt')} className="w-full bg-amber-500 text-white py-2 rounded-xl text-xs font-bold">Copy AI Image Prompt</button>
            <label className="block text-xs font-semibold text-green-700 cursor-pointer">Featured image (Cloudinary)
              <input type="file" accept="image/*" className="hidden" onChange={uploadCoverFn} />
            </label>
            {cover && <img src={cover} alt="" className="h-20 w-full object-cover rounded-xl" />}
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm font-mono" rows={12} placeholder="Article Markdown (AI writer fills this automatically)..." value={content} onChange={(e) => setContent(e.target.value)} />
            <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="YouTube video URL (optional)" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
            <select className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
              <option value="">- Ebook CTA: none -</option>
              {ebooks.map((eb) => <option key={eb.id} value={eb.id}>{eb.title}</option>)}
            </select>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">5. FAQ + SOURCES (auto-filled by AI)</p>
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={4} placeholder="Question | Answer (one per line)" value={faqText} onChange={(e) => setFaqText(e.target.value)} />
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={3} placeholder="Source title | Organization | URL (one per line)" value={srcText} onChange={(e) => setSrcText(e.target.value)} />
          </div>

          {social && (
            <div className="glass-card p-4 rounded-2xl space-y-2">
              <p className="text-sm font-extrabold text-forest-700">6. SOCIAL DISTRIBUTION PACK</p>              <button onClick={() => copy(social.fb, 'Facebook post')} className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold">Copy Facebook post</button>
              <button onClick={() => copy(social.ig, 'Instagram caption')} className="w-full bg-pink-600 text-white py-2 rounded-xl text-xs font-bold">Copy Instagram caption</button>
              <button onClick={() => copy(social.x, 'X post')} className="w-full bg-gray-800 text-white py-2 rounded-xl text-xs font-bold">Copy X post</button>
              <button onClick={() => copy(social.li, 'LinkedIn post')} className="w-full bg-sky-700 text-white py-2 rounded-xl text-xs font-bold">Copy LinkedIn post</button>
              <button onClick={() => copy(social.pin, 'Pinterest description')} className="w-full bg-red-600 text-white py-2 rounded-xl text-xs font-bold">Copy Pinterest description</button>
            </div>
          )}

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">7. QUALITY AUDIT</p>
            <button onClick={runAudit} className="w-full bg-forest-600 text-white py-2.5 rounded-xl font-extrabold">RUN SEO READINESS AUDIT</button>
            {audit.length > 0 && (
              <>
                <p className="text-2xl font-extrabold text-center">{score}<span className="text-sm text-gray-400">/100 editorial score</span></p>
                {audit.map((c) => (
                  <p key={c.k} className={'text-xs font-bold ' + (c.ok ? 'text-green-700' : 'text-amber-600')}>{c.ok ? 'PASS' : 'REVIEW'} - {c.k}</p>
                ))}
              </>
            )}
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2 border-2 border-green-400">
            <p className="text-sm font-extrabold text-green-700">8. PUBLISH</p>
            <div className="flex gap-2">
              <select className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="updating">Updating</option>
                <option value="archived">Archived</option>
              </select>
              <label className="flex items-center gap-1 text-xs font-bold"><input type="checkbox" checked={indexable} onChange={(e) => setIndexable(e.target.checked)} /> indexable</label>
            </div>
            <button onClick={publish} className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold">{editId ? 'UPDATE ARTICLE' : 'PUBLISH ARTICLE'}</button>
            <p className="text-[9px] text-gray-400">Never publish below 60/100 without review. Searcher first, always.</p>
          </div>
        </>
      )}
    </div>
  );
}