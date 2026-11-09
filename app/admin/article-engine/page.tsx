'use client';

import { useState } from 'react';

export default function ArticleEnginePage() {
  const [msg, setMsg] = useState('');
  
  // Branding State
  const [brandType, setBrandType] = useState<'default' | 'custom'>('default');
  const [customBrandName, setCustomBrandName] = useState('');
  const [customBrandUrl, setCustomBrandUrl] = useState('');

  // Article State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('published');
  
  // AI State
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [audit, setAudit] = useState<any>(null);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  // 1. THE SEO AUDITOR
  function runAudit() {
    if (!content) return flash('Please write some content first.');
    
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const h2Count = (content.match(/## /g) || []).length;
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    const paragraphs = content.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 100).length;
    
    const checks = [];
    let score = 0;

    // Title check
    if (title.length >= 30 && title.length <= 65) { score += 10; checks.push({ label: 'Title Length (Good)', pass: true, action: '' }); }
    else { checks.push({ label: 'Title Length', pass: false, action: 'Aim for 30-65 characters.' }); }

    // Word count
    if (wordCount >= 600) { score += 20; checks.push({ label: 'Word Count (600+)', pass: true, action: '' }); }
    else { checks.push({ label: `Word Count (${wordCount})`, pass: false, action: `Add ${600 - wordCount} more words.` }); }

    // Headings
    if (h2Count >= 2) { score += 20; checks.push({ label: 'Headings (2+ H2s)', pass: true, action: '' }); }
    else { checks.push({ label: 'Headings', pass: false, action: 'Add 2+ headings using ##.' }); }

    // Links
    if (linkCount >= 2) { score += 20; checks.push({ label: 'Links (2+)', pass: true, action: '' }); }
    else { checks.push({ label: 'Links', pass: false, action: 'Add 2+ internal/external links.' }); }

    // Readability
    if (longParagraphs === 0) { score += 15; checks.push({ label: 'Readability', pass: true, action: '' }); }
    else { checks.push({ label: 'Readability', pass: false, action: `${longParagraphs} paragraphs are too long.` }); }

    // Formatting (Bold)
    if (content.includes('**')) { score += 15; checks.push({ label: 'Formatting (Bold)', pass: true, action: '' }); }
    else { checks.push({ label: 'Formatting', pass: false, action: 'Use **bold** for key terms.' }); }

    setAudit({ score, checks });
    flash('Audit complete!');
  }

  // 2. THE PROMPT GENERATOR
  async function generatePrompts() {
    if (!title) return flash('Enter a title first.');
    
    const finalBrandName = brandType === 'default' ? 'Farming Tech & Business' : customBrandName;
    const finalBrandUrl = brandType === 'default' ? 'www.farmingtechbusiness.com' : customBrandUrl;
    
    let key = localStorage.getItem('ftb_gemini_key') || '';
    if (!key) {
      const p = window.prompt('Paste your Google Gemini API key:');
      if (!p) return;
      key = p.trim();
      localStorage.setItem('ftb_gemini_key', key);
    }

    setAiBusy(true);
    setAiPrompts([]);
    flash('Generating image prompts...');

    const systemPrompt = `You are a world-class visual strategist. Generate 4 viral Pinterest prompts (2:3) and 3 Facebook prompts (4:5) for the topic provided. 
    The prompts must demand photorealistic, 8k quality images. Include this exact text at the bottom of the image in the prompt: "${finalBrandName} | ${finalBrandUrl}".
    Output format:
    ---PINTEREST---
    [Prompt 1]
    [SEPARATOR]
    [Prompt 2]
    [SEPARATOR]
    [Prompt 3]
    [SEPARATOR]
    [Prompt 4]
    ---FACEBOOK---
    [Prompt 1]
    [SEPARATOR]
    [Prompt 2]
    [SEPARATOR]
    [Prompt 3]`;

    const models = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-pro'];
    let text = '';

    for (let i = 0; i < models.length; i++) {
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + key, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: `Topic: ${title}\nDescription: ${metaDesc}` }] }],
          }),
        });
        const data = await res.json();
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) break;
      } catch (err) {}
    }

    if (!text) {
      alert('AI failed to generate prompts.');
      setAiBusy(false);
      return;
    }

    try {
      const pinPart = text.split('---PINTEREST---')[1]?.split('---FACEBOOK---')[0] || '';
      const fbPart = text.split('---FACEBOOK---')[1] || '';
      const allPrompts = [...pinPart.split('[SEPARATOR]'), ...fbPart.split('[SEPARATOR]')].map(s => s.trim()).filter(Boolean);
      setAiPrompts(allPrompts);
      flash('Prompts ready!');
    } catch (e) {
      alert('Error parsing AI response.');
    }
    setAiBusy(false);
  }

  function copyPrompt(text: string) {
    navigator.clipboard.writeText(text);
    flash('Prompt copied!');
  }

  // 3. PUBLISH FUNCTION
  async function publishArticle() {
    if (!title || !content) return flash('Title and content are required.');
    if (audit && audit.score < 80 && !window.confirm('Your SEO score is below 80. Publish anyway?')) return;
    
    flash('Publishing... (Connect this to your Supabase insert function)');
    // Note: You will need to add your Supabase insert logic here later!
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🧠 AI Article & SEO Engine</h1>
        <p className="text-xs text-gray-500">Write, audit, and generate images for your article.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      {/* 1. ARTICLE WRITING */}
      <div className="glass-card p-4 rounded-2xl space-y-3 border border-gray-100">
        <p className="text-sm font-extrabold text-forest-700">1. Write Your Article</p>
        
        <input 
          className="w-full p-2 rounded-xl border border-gray-200 text-sm font-bold" 
          placeholder="Article Title *" 
          value={title} 
          onChange={(e) => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} 
        />
        
        <input 
          className="w-full p-2 rounded-xl border border-gray-200 text-xs bg-gray-50" 
          placeholder="URL Slug (auto-generated)" 
          value={slug} 
          onChange={(e) => setSlug(e.target.value)} 
        />

        <textarea 
          className="w-full p-3 rounded-xl border border-gray-200 text-sm h-64 font-mono" 
          placeholder="Paste your Google Doc text here..." 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
        />
      </div>

      {/* 2. SEO AUDIT */}
      <div className="glass-card p-4 rounded-2xl space-y-3 border-2 border-blue-300">
        <div className="flex justify-between items-center">
          <p className="text-sm font-extrabold text-blue-800">2. SEO Audit</p>
          <button onClick={runAudit} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Check Score</button>
        </div>
        
        {audit && (
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100">
              <span className="font-extrabold text-gray-700">Score</span>
              <span className={`text-2xl font-extrabold ${audit.score >= 80 ? 'text-green-600' : 'text-red-500'}`}>{audit.score}/100</span>
            </div>
            {audit.checks.map((c: any, i: number) => (
              <div key={i} className="flex flex-col text-xs bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>{c.pass ? '✅' : '❌'}</span>
                  <span className={c.pass ? 'text-gray-700' : 'text-red-600 font-bold'}>{c.label}</span>
                </div>
                {!c.pass && <p className="text-gray-500 mt-1 ml-6">👉 {c.action}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. IMAGE PROMPTS */}
      <div className="glass-card p-4 rounded-2xl space-y-3 border-2 border-purple-300">
        <p className="text-sm font-extrabold text-purple-800">3. Image Prompts</p>
        
        <select className="w-full p-2 rounded-xl border border-gray-200 text-sm mb-2" value={brandType} onChange={(e) => setBrandType(e.target.value as any)}>
          <option value="default">Farming Tech & Business Branding</option>
          <option value="custom">Custom Brand...</option>
        </select>

        {brandType === 'custom' && (
          <div className="flex gap-2 mb-2">
            <input className="flex-1 p-2 rounded-xl border border-gray-200 text-sm" placeholder="Brand Name" onChange={(e) => setCustomBrandName(e.target.value)} />
            <input className="flex-1 p-2 rounded-xl border border-gray-200 text-sm" placeholder="Brand URL" onChange={(e) => setCustomBrandUrl(e.target.value)} />
          </div>
        )}

        <button onClick={generatePrompts} disabled={aiBusy} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm">
          {aiBusy ? 'Generating...' : '🪄 Generate Prompts'}
        </button>

        {aiPrompts.map((p, i) => (
          <div key={i} className="mt-2 bg-purple-50 p-3 rounded-xl border border-purple-200">
            <textarea className="w-full bg-transparent text-xs font-mono outline-none" rows={3} readOnly value={p} />
            <button onClick={() => copyPrompt(p)} className="w-full mt-2 bg-white text-purple-700 py-1 rounded-lg text-xs font-bold border border-purple-200">📋 Copy</button>
          </div>
        ))}
      </div>

      {/* 4. PUBLISH */}
      <div className="glass-card p-4 rounded-2xl space-y-3 border-2 border-green-400 bg-green-50">
        <p className="text-sm font-extrabold text-green-900">4. Ready to Publish?</p>
        <button onClick={publishArticle} className="w-full bg-green-600 text-white py-4 rounded-xl font-extrabold shadow-md active:scale-95 transition-transform">
          🚀 PUBLISH ARTICLE
        </button>
      </div>
    </div>
  );
}