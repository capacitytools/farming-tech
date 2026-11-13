'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeoEnginePage() {
  const router = useRouter();
  const [msg, setMsg] = useState('');

  // Tabs
  const [tab, setTab] = useState<'prompt' | 'audit'>('prompt');

  // PROMPT STATE
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Beginner farmers in Nigeria');
  const [country, setCountry] = useState('Nigeria');
  const [promptBusy, setPromptBusy] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // AUDIT STATE
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audit, setAudit] = useState<any>(null);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    flash('📋 Copied to clipboard!');
  }

  // 🚨 PHASE 1: THE PROMPT GENERATOR 🚨
  async function generateMasterPrompt() {
    if (!topic) return flash('Please enter a topic first.');
    setPromptBusy(true);
    setGeneratedPrompt('');

    let key = localStorage.getItem('ftb_gemini_key') || '';
    if (!key) {
      const p = window.prompt('Paste your Google Gemini API key:');
      if (!p) return;
      key = p.trim();
      localStorage.setItem('ftb_gemini_key', key);
    }

    const systemPrompt = `You are an Elite SEO Director with 15 years of experience ranking #1 on Google. 
    I will give you a Topic, Audience, and Country. 
    Your job is to write a MASTER ARTICLE WRITING PROMPT that I can copy and paste into ChatGPT to generate a 100/100 SEO article.

    The prompt you write MUST include these strict instructions for ChatGPT:
    - The article title must be exactly 30-65 characters.
    - The article must contain at least 2 H2 headings (##) and 1 H3 heading (###).
    - Paragraphs must NOT exceed 80 words.
    - It must include 2 internal links formatted exactly as [Anchor Text](/blog/example-slug).
    - It must include 1 external link to a credible source like [FAO](https://www.fao.org).
    - It must bold at least 5 key terms using **.
    - It must include a Markdown table using | pipes.
    - It must include an FAQ section at the end.
    - It must sound 100% human, no AI jargon.`;

    const userPrompt = `Topic: ${topic}\nTarget Audience: ${audience}\nCountry: ${country}`;

    const models = ['gemini-flash-latest', 'gemini-2.5-flash'];
    let text = '';

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
      } catch (err) {}
    }

    if (!text) {
      alert('AI failed to generate. Try again.');
    } else {
      setGeneratedPrompt(text.trim());
    }
    setPromptBusy(false);
  }

  // 🚨 PHASE 2: THE AUDITOR 🚨
  function runAudit() {
    if (!content) return flash('Please paste the article to audit.');
    
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const h2Count = (content.match(/## /g) || []).length;
    const h3Count = (content.match(/### /g) || []).length;
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    const tableCount = (content.match(/\|/g) || []).length;
    const boldCount = (content.match(/\*\*/g) || []).length;
    const paragraphs = content.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 80).length;
    
    const checks = [];
    let score = 0;

    // Title check
    if (title.length >= 30 && title.length <= 65) { score += 10; checks.push({ label: 'Title Length', pass: true }); }
    else { checks.push({ label: 'Title Length', pass: false, action: 'Must be 30-65 characters.' }); }

    // Word count
    if (wordCount >= 600) { score += 20; checks.push({ label: 'Word Count', pass: true }); }
    else { checks.push({ label: `Word Count (${wordCount})`, pass: false, action: 'Add more words (aim 600+).' }); }

    // Headings
    if (h2Count >= 2 && h3Count >= 1) { score += 20; checks.push({ label: 'Headings', pass: true }); }
    else { checks.push({ label: 'Headings', pass: false, action: 'Add 2+ H2s and 1+ H3.' }); }

    // Links
    if (linkCount >= 3) { score += 15; checks.push({ label: 'Links', pass: true }); }
    else { checks.push({ label: 'Links', pass: false, action: 'Add 3+ links (2 internal, 1 external).' }); }

    // Bold & Table
    if (boldCount >= 10 && tableCount >= 4) { score += 15; checks.push({ label: 'Formatting & Tables', pass: true }); }
    else { checks.push({ label: 'Formatting & Tables', pass: false, action: 'Add bolding and a Markdown table.' }); }

    // Readability
    if (longParagraphs === 0) { score += 10; checks.push({ label: 'Readability', pass: true }); }
    else { checks.push({ label: 'Readability', pass: false, action: `${longParagraphs} paragraphs over 80 words.` }); }

    // FAQ
    if (content.toLowerCase().includes('frequently asked questions') || content.toLowerCase().includes('faq')) { score += 10; checks.push({ label: 'FAQ Section', pass: true }); }
    else { checks.push({ label: 'FAQ Section', pass: false, action: 'Add an FAQ section at the end.' }); }

    setAudit({ score, checks });
    flash('Audit complete!');
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🧠 AI Article & SEO Engine</h1>
        <p className="text-xs text-gray-500">Generate master prompts and audit your articles.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      {/* TABS */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setTab('prompt')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === 'prompt' ? 'bg-white shadow text-forest-800' : 'text-gray-500'}`}>
          1. Generate Prompt
        </button>
        <button onClick={() => setTab('audit')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === 'audit' ? 'bg-white shadow text-forest-800' : 'text-gray-500'}`}>
          2. Audit Article
        </button>
      </div>

      {/* 🚨 TAB 1: PROMPT GENERATOR 🚨 */}
      {tab === 'prompt' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-gray-100 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Article Topic</label>
              <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="e.g. Best Rabbit Breeds for Beginners" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Target Audience</label>
              <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Country</label>
              <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>

            <button onClick={generateMasterPrompt} disabled={promptBusy} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md disabled:opacity-50 mt-2">
              {promptBusy ? 'Analyzing & Structuring...' : '🪄 GENERATE MASTER PROMPT'}
            </button>
          </div>

          {generatedPrompt && (
            <div className="glass-card p-4 rounded-2xl border-2 border-purple-300 space-y-3">
              <p className="text-sm font-extrabold text-purple-800">Copy this into ChatGPT:</p>
              <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono h-60" readOnly value={generatedPrompt} />
              <button onClick={() => copyToClipboard(generatedPrompt)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
                📋 COPY PROMPT
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🚨 TAB 2: THE AUDITOR 🚨 */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-gray-100 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Article Title</label>
              <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1 font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Article Content (Markdown)</label>
              <textarea className="w-full p-3 rounded-xl border border-gray-200 text-sm h-64 font-mono mt-1" placeholder="Paste your article here to check its score..." value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <button onClick={runAudit} className="w-full bg-blue-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
              📊 CHECK SEO SCORE
            </button>
          </div>

          {audit && (
            <div className="glass-card p-4 rounded-2xl border-2 border-blue-300 space-y-3">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-blue-100">
                <span className="font-extrabold text-gray-700">SEO Score</span>
                <span className={`text-4xl font-extrabold ${audit.score >= 90 ? 'text-green-600' : audit.score >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{audit.score}/100</span>
              </div>
              <div className="space-y-2">
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
            </div>
          )}
        </div>
      )}

    </div>
  );
}