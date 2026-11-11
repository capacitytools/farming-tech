'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ArticleEnginePage() {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  
  // Article State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Audit State
  const [audit, setAudit] = useState<any>(null);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  // 🚨 THE SEO AUDITOR 🚨
  function runAudit() {
    if (!content) return flash('Please write some content first.');
    
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const h2Count = (content.match(/## /g) || []).length;
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    const paragraphs = content.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 100).length;
    
    const checks = [];
    let score = 0;

    if (title.length >= 30 && title.length <= 65) { score += 10; checks.push({ label: 'Title Length (Good)', pass: true }); }
    else { checks.push({ label: 'Title Length', pass: false, action: 'Aim for 30-65 characters.' }); }

    if (wordCount >= 600) { score += 20; checks.push({ label: 'Word Count (600+)', pass: true }); }
    else { checks.push({ label: `Word Count (${wordCount})`, pass: false, action: `Add ${600 - wordCount} more words.` }); }

    if (h2Count >= 2) { score += 20; checks.push({ label: 'Headings (2+ H2s)', pass: true }); }
    else { checks.push({ label: 'Headings', pass: false, action: 'Add 2+ headings using ##.' }); }

    if (linkCount >= 2) { score += 20; checks.push({ label: 'Links (2+)', pass: true }); }
    else { checks.push({ label: 'Links', pass: false, action: 'Add 2+ internal/external links.' }); }

    if (longParagraphs === 0) { score += 15; checks.push({ label: 'Readability', pass: true }); }
    else { checks.push({ label: 'Readability', pass: false, action: `${longParagraphs} paragraphs are too long.` }); }

    if (content.includes('**')) { score += 15; checks.push({ label: 'Formatting (Bold)', pass: true }); }
    else { checks.push({ label: 'Formatting', pass: false, action: 'Use **bold** for key terms.' }); }

    setAudit({ score, checks });
    flash('Audit complete!');
  }

  function copyCleanArticle() {
    if (!content) return flash('No content to copy.');
    navigator.clipboard.writeText(content);
    flash('📋 Clean article copied!');
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">✍️ Article Writer</h1>
        <p className="text-xs text-gray-500">Write, score, and copy your clean article.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      {/* WRITING AREA */}
      <div className="glass-card p-4 rounded-2xl space-y-3 border border-gray-100">
        <input 
          className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-forest-500" 
          placeholder="Article Title *" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />

        <textarea 
          className="w-full p-3 rounded-xl border border-gray-200 text-sm h-80 font-mono outline-none focus:ring-2 focus:ring-forest-500" 
          placeholder="Paste your Google Doc text here..." 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
        />
      </div>

      {/* SEO AUDIT */}
      <div className="glass-card p-4 rounded-2xl space-y-3 border-2 border-blue-300">
        <div className="flex justify-between items-center">
          <p className="text-sm font-extrabold text-blue-800">SEO Audit</p>
          <button onClick={runAudit} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Check Score</button>
        </div>
        
        {audit && (
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100">
              <span className="font-extrabold text-gray-700">Score</span>
              <span className={`text-3xl font-extrabold ${audit.score >= 80 ? 'text-green-600' : 'text-red-500'}`}>{audit.score}/100</span>
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

      {/* ACTION BUTTONS */}
      <div className="space-y-3">
        <button onClick={copyCleanArticle} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md active:scale-95 transition-transform flex justify-center items-center gap-2">
          📋 COPY CLEAN ARTICLE
        </button>

        <button onClick={() => router.push('/admin/quick-post')} className="w-full bg-amber-400 text-forest-900 py-4 rounded-xl font-extrabold shadow-md active:scale-95 transition-transform flex justify-center items-center gap-2">
          🚀 GO TO QUICK POST (Publish)
        </button>
      </div>
    </div>
  );
}