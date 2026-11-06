'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PromptStudioPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  
  // Mode: 'existing' or 'manual'
  const [mode, setMode] = useState<'existing' | 'manual'>('existing');

  // Brand State
  const [brandType, setBrandType] = useState<'default' | 'custom'>('default');
  const [customBrandName, setCustomBrandName] = useState('');
  const [customBrandUrl, setCustomBrandUrl] = useState('');

  // Form State
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [details, setDetails] = useState('');

  // Output State
  const [pinterestPrompts, setPinterestPrompts] = useState<string[]>([]);
  const [facebookPrompts, setFacebookPrompts] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    // Grab ALL blogs so the dropdown is never empty
    if (admin) {
      const { data: b } = await supabase
        .from('blogs')
        .select('id,title,meta_description,excerpt,content')
        .order('created_at', { ascending: false });
      setBlogs(b || []);
    }
    
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function handleSelectBlog(id: string) {
    setSelectedId(id);
    const b = blogs.find(x => x.id === id);
    if (b) {
      setTitle(b.title);
      setDesc(b.meta_description || b.excerpt || '');
      setDetails((b.content || '').slice(0, 800) + '...');
    }
  }

  async function generatePrompts() {
    if (!title || !desc) return flash('Title and Description are required.');
    
    // Determine brand text
    const finalBrandName = brandType === 'default' ? 'Farming Tech & Business' : customBrandName;
    const finalBrandUrl = brandType === 'default' ? 'www.farmingtechbusiness.com' : customBrandUrl;
    
    if (!finalBrandName || !finalBrandUrl) return flash('Please fill in your Brand Name and Website.');

    let key = localStorage.getItem('ftb_gemini_key') || '';
    if (!key) {
      const p = window.prompt('Paste your free Google Gemini API key (get it at aistudio.google.com/apikey):');
      if (!p) return;
      key = p.trim();
      localStorage.setItem('ftb_gemini_key', key);
    }

    setAiBusy(true);
    setPinterestPrompts([]);
    setFacebookPrompts([]);
    flash('Veteran Strategist is running viral research... 20-40 seconds.');

    const systemPrompt = `You are a world-class visual strategist and AI prompt engineer with 15 years of experience dominating Pinterest and Facebook. Your clients generate 5,000+ daily organic traffic from visual search alone. 

Your task is to analyze the user's topic and generate 7 hyper-detailed, highly optimized image generation prompts (for Midjourney v6/DALL-E 3). 
You must simulate a deep scan of the top 10-20 viral accounts in this niche. What are the winning angles? What lighting, colors, and compositions are getting the highest saves and clicks right now?

RULES FOR ALL PROMPTS:
1. Absolute photorealism, 8k resolution, professional editorial photography.
2. Vary the styles: One bright and airy, one cinematic and moody, one close-up macro, one wide lifestyle shot. Vary the color palettes based on what performs best in this niche.
3. THE BRANDING RULE: At the bottom of the image, there must be a clean, elegant, highly legible text overlay that reads exactly: "${finalBrandName} | ${finalBrandUrl}". 
4. TYPOGRAPHY: The text must be in a modern, professional sans-serif or elegant serif font, colored white or gold, placed perfectly in the bottom margin. It must be perfectly spelled. Double-check the spelling character by character before generating.

PINTEREST (Vertical 2:3 - aspect ratio 2:3):
- Provide exactly 4 distinct prompts.

FACEBOOK/INSTAGRAM (Vertical 4:5 - aspect ratio 4:5):
- Provide exactly 3 distinct prompts.

OUTPUT FORMAT (You MUST follow this exactly):
---PINTEREST---
[Prompt 1 text]
[PROMPT_SEPARATOR]
[Prompt 2 text]
[PROMPT_SEPARATOR]
[Prompt 3 text]
[PROMPT_SEPARATOR]
[Prompt 4 text]
---FACEBOOK---
[Prompt 1 text]
[PROMPT_SEPARATOR]
[Prompt 2 text]
[PROMPT_SEPARATOR]
[Prompt 3 text]`;

    const userPrompt = `Topic: ${title}
Description: ${desc}
Key Details: ${details || 'None provided'}`;

    const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.8-pro'];
    let text = '';
    const errs: string[] = [];

    for (let i = 0; i < models.length; i++) {
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + key, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
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
      alert('AI failed:\n' + errs.join('\n'));
      setAiBusy(false);
      return;
    }

    // Parse the output safely
    try {
      const pinPart = text.split('---PINTEREST---')[1]?.split('---FACEBOOK---')[0] || '';
      const fbPart = text.split('---FACEBOOK---')[1] || '';

      const pinPrompts = pinPart.split('[PROMPT_SEPARATOR]').map((s: string) => s.trim()).filter(Boolean);
      const fbPrompts = fbPart.split('[PROMPT_SEPARATOR]').map((s: string) => s.trim()).filter(Boolean);

      setPinterestPrompts(pinPrompts);
      setFacebookPrompts(fbPrompts);
      flash('7 Master Prompts generated!');
    } catch (e) {
      alert('Error parsing AI response. Try again.');
    }
    
    setAiBusy(false);
  }

  function copyPrompt(text: string) {
    navigator.clipboard.writeText(text);
    flash('Prompt copied to clipboard!');
  }

  if (!loaded) return <p className="text-center p-10">Loading Studio...</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🪄 Viral Prompt Engineer</h1>
        <p className="text-xs text-gray-500">Generate 4 Pinterest + 3 Facebook image prompts built for viral traffic.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-4">
        
        {/* BRAND SETTINGS */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <p className="text-sm font-extrabold text-forest-700 mb-2">1. YOUR BRANDING</p>
          <select
            className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mb-2 font-bold"
            value={brandType}
            onChange={(e) => setBrandType(e.target.value as 'default' | 'custom')}
          >
            <option value="default">Farming Tech & Business (Default)</option>
            <option value="custom">Custom Brand...</option>
          </select>
          
          {brandType === 'custom' && (
            <div className="space-y-2 mt-2">
              <input
                className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
                placeholder="Your Brand Name (e.g., AgriSmart)"
                value={customBrandName}
                onChange={(e) => setCustomBrandName(e.target.value)}
              />
              <input
                className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
                placeholder="Your Website (e.g., www.agrismart.com)"
                value={customBrandUrl}
                onChange={(e) => setCustomBrandUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-extrabold text-forest-700 mb-2">2. TOPIC SOURCE</p>
          {admin && (
            <div className="flex gap-2 mb-2">
              <button onClick={() => setMode('existing')} className={'flex-1 py-1.5 rounded-lg text-xs font-bold ' + (mode === 'existing' ? 'bg-gray-800 text-white' : 'bg-gray-200')}>Existing Blog</button>
              <button onClick={() => setMode('manual')} className={'flex-1 py-1.5 rounded-lg text-xs font-bold ' + (mode === 'manual' ? 'bg-gray-800 text-white' : 'bg-gray-200')}>Manual Entry</button>
            </div>
          )}

          {admin && mode === 'existing' ? (
            <select
              className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mb-2"
              value={selectedId}
              onChange={(e) => handleSelectBlog(e.target.value)}
            >
              <option value="">- Select a published article -</option>
              {blogs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          ) : null}

          <input
            className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mb-2"
            placeholder="Title / Topic *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mb-2"
            rows={2}
            placeholder="Short Description *"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <textarea
            className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
            rows={2}
            placeholder="Key Details (e.g., specific animals, colors, settings)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        <button onClick={generatePrompts} disabled={aiBusy} className="w-full bg-purple-600 text-white py-4 rounded-xl font-extrabold shadow-lg disabled:opacity-50 text-sm">
          {aiBusy ? 'Scanning Trends & Engineering...' : '🪄 GENERATE 7 MASTER PROMPTS'}
        </button>
      </div>

      {/* PINTEREST RESULTS */}
      {pinterestPrompts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-forest-800 flex items-center gap-2">
            📌 Pinterest Prompts (2:3)
          </h2>
          {pinterestPrompts.map((p, i) => (
            <div key={i} className="glass-card p-4 rounded-2xl space-y-2 border-l-4 border-red-500 bg-red-50/20">
              <p className="text-xs font-bold text-red-800">Variation {i + 1}</p>
              <textarea
                className="w-full p-2 rounded-xl border border-red-200 bg-white/90 text-xs font-mono"
                rows={4}
                value={p}
                readOnly
              />
              <button onClick={() => copyPrompt(p)} className="w-full bg-red-600 text-white py-2 rounded-xl text-xs font-bold shadow">
                📋 Copy Pinterest Prompt {i + 1}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FACEBOOK RESULTS */}
      {facebookPrompts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-forest-800 flex items-center gap-2">
            📘 Facebook/Instagram Prompts (4:5)
          </h2>
          {facebookPrompts.map((p, i) => (
            <div key={i} className="glass-card p-4 rounded-2xl space-y-2 border-l-4 border-blue-500 bg-blue-50/20">
              <p className="text-xs font-bold text-blue-800">Variation {i + 1}</p>
              <textarea
                className="w-full p-2 rounded-xl border border-blue-200 bg-white/90 text-xs font-mono"
                rows={4}
                value={p}
                readOnly
              />
              <button onClick={() => copyPrompt(p)} className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold shadow">
                📋 Copy Facebook Prompt {i + 1}
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}