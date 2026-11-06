'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PromptStudioPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mode: 'existing' or 'manual'
  const [mode, setMode] = useState<'existing' | 'manual'>('existing');

  // Form State
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [details, setDetails] = useState('');
  const [platform, setPlatform] = useState<'pinterest' | 'facebook'>('pinterest');

  // Output State
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data: b } = await supabase
      .from('blogs')
      .select('id,title,meta_description,excerpt,content')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    setBlogs(b || []);
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
      // Grab the first 500 chars of the content for AI details
      setDetails((b.content || '').slice(0, 500) + '...');
    }
  }

  async function generateMasterPrompt() {
    if (!title || !desc) return flash('Title and Description are required.');
    
    let key = localStorage.getItem('ftb_gemini_key') || '';
    if (!key) {
      const p = window.prompt('Paste your free Google Gemini API key (get it at aistudio.google.com/apikey):');
      if (!p) return;
      key = p.trim();
      localStorage.setItem('ftb_gemini_key', key);
    }

    setAiBusy(true);
    setGeneratedPrompt('');
    flash('Analyzing niche and engineering prompt... 15-30 seconds.');

    const systemPrompt = `You are an elite, world-class visual director and AI prompt engineer for top-tier blogs.
Your goal is to write the absolute best, most professional image generation prompt (for Midjourney v6 or DALL-E 3) that will dominate the visual search results on ${platform === 'pinterest' ? 'Pinterest (Vertical 2:3)' : 'Facebook/Instagram (Square 1:1)'}.

Rules for the prompt:
1. **Niche Analysis:** Analyze the topic and imagine the top 10 most successful, highly-clicked images in this exact niche. Incorporate those winning visual tropes (lighting, composition, vibe) into the prompt.
2. **Photorealism:** The prompt must specify high-end, photorealistic, 8k resolution, professional DSLR photography.
3. **The "FTB Brand Space" Rule:** The prompt MUST explicitly instruct the AI to leave negative space at the bottom of the image, perfectly lit for a text overlay/logo to be added later.
4. **No Text:** The prompt must explicitly state "No text, no words, no watermarks" so the AI doesn't generate gibberish text.
5. **Format:** Return ONLY the prompt text. No conversational filler. Just the exact prompt I can copy and paste.`;

    const userPrompt = `Topic/Title: ${title}
Description: ${desc}
Key Details: ${details || 'None provided'}
Target Platform: ${platform === 'pinterest' ? 'Pinterest (Tall/Vertical)' : 'Facebook/Instagram (Square)'}`;

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
      alert('AI tried all models but failed:\n' + errs.join('\n'));
      setAiBusy(false);
      return;
    }

    setGeneratedPrompt(text.trim());
    setAiBusy(false);
    flash('Prompt engineered! Ready to copy.');
  }

  function copyPrompt() {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    flash('Master Prompt copied to clipboard!');
  }

  if (!loaded) return <p className="text-center p-10">Loading Prompt Studio...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🪄 Elite Prompt Engineer</h1>
        <p className="text-xs text-gray-500">Generate industry-leading AI image prompts for your covers.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-2">
        <p className="text-sm font-extrabold text-forest-700">1. TARGET PLATFORM</p>
        <div className="flex gap-2">
          <button onClick={() => setPlatform('pinterest')} className={'flex-1 py-2 rounded-xl text-xs font-bold ' + (platform === 'pinterest' ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600')}>Pinterest (Vertical)</button>
          <button onClick={() => setPlatform('facebook')} className={'flex-1 py-2 rounded-xl text-xs font-bold ' + (platform === 'facebook' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>Facebook (Square)</button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-2">
        <p className="text-sm font-extrabold text-forest-700">2. TOPIC SOURCE</p>
        <div className="flex gap-2 mb-2">
          <button onClick={() => setMode('existing')} className={'flex-1 py-1.5 rounded-lg text-xs font-bold ' + (mode === 'existing' ? 'bg-gray-800 text-white' : 'bg-gray-200')}>Use Existing Article</button>
          <button onClick={() => setMode('manual')} className={'flex-1 py-1.5 rounded-lg text-xs font-bold ' + (mode === 'manual' ? 'bg-gray-800 text-white' : 'bg-gray-200')}>Manual Entry</button>
        </div>

        {mode === 'existing' ? (
          <select
            className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
            value={selectedId}
            onChange={(e) => handleSelectBlog(e.target.value)}
          >
            <option value="">- Select a published article -</option>
            {blogs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        ) : null}

        <input
          className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mt-2"
          placeholder="Title / Topic *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
          rows={2}
          placeholder="Short Description *"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <textarea
          className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
          rows={3}
          placeholder="Key Details (optional - e.g., specific colors, animals, setting)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>

      <button onClick={generateMasterPrompt} disabled={aiBusy} className="w-full bg-purple-600 text-white py-4 rounded-xl font-extrabold shadow-lg disabled:opacity-50">
        {aiBusy ? 'Analyzing Niche & Engineering Prompt...' : '🪄 ENGINEER MASTER IMAGE PROMPT'}
      </button>

      {generatedPrompt && (
        <div className="glass-card p-4 rounded-2xl space-y-2 border-2 border-purple-400 bg-purple-50/30">
          <p className="text-sm font-extrabold text-purple-800">🏆 YOUR MASTER PROMPT</p>
          <p className="text-[10px] text-purple-600 mb-2">Copy this and paste it into Midjourney, DALL-E 3, or Leonardo AI.</p>
          
          <textarea
            className="w-full p-3 rounded-xl border border-purple-200 bg-white/90 text-sm font-mono"
            rows={8}
            value={generatedPrompt}
            readOnly
          />
          
          <button onClick={copyPrompt} className="w-full bg-forest-800 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
            📋 COPY PROMPT TO CLIPBOARD
          </button>
        </div>
      )}
    </div>
  );
}