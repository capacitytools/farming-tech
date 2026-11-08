'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocImporterPage() {
  const [rawText, setRawText] = useState('');
  const [converted, setConverted] = useState('');
  const [audit, setAudit] = useState<any>(null);

  function processAndFix() {
    if (!rawText.trim()) return alert('Please paste your text first.');

    // 1. Clean up basic text (handles both plain text and HTML)
    let cleanText = rawText;
    
    // If it's HTML from Google Docs, strip the basic tags but keep line breaks
    if (cleanText.includes('<p>') || cleanText.includes('<h')) {
      cleanText = cleanText
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '\n\n## $1\n\n') // Convert headings
        .replace(/<p[^>]*>(.*?)<\/p>/g, '\n$1\n') // Convert paragraphs
        .replace(/<br\s*\/?>/gi, '\n') // Convert breaks
        .replace(/<[^>]+>/g, ''); // Strip all other HTML tags
    }

    // 2. Format it into Markdown
    let formatted = cleanText
      .replace(/\n{3,}/g, '\n\n') // Remove extra blank lines
      .trim();

    // Automatically bold common headers if they are missing ##
    const lines = formatted.split('\n');
    const fixedLines = lines.map((line: string) => {
      const trimLine = line.trim();
      // If the line is short, has no punctuation at the end, and no ##, make it a header
      if (trimLine.length > 0 && trimLine.length < 60 && !trimLine.endsWith('.') && !trimLine.endsWith('?') && !trimLine.startsWith('#')) {
        return `## ${trimLine}`;
      }
      return line;
    });

    formatted = fixedLines.join('\n');
    setConverted(formatted);

    // 3. Calculate SEO Score
    const wordCount = formatted.split(/\s+/).filter(w => w.length > 0).length;
    const h2Count = (formatted.match(/## /g) || []).length;
    const linkCount = (formatted.match(/\[.*?\]\(.*?\)/g) || []).length;
    const boldCount = (formatted.match(/\*\*.*?\*\*/g) || []).length;
    const paragraphs = formatted.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 100).length;

    const checks = [];
    let score = 0;

    // Length (600+)
    if (wordCount >= 600) { score += 20; checks.push({ label: 'Length (600+ words)', pass: true, action: 'Perfect.' }); }
    else { checks.push({ label: `Length (${wordCount} words)`, pass: false, action: `Add ${600 - wordCount} more words.` }); }

    // Subheadings (2+)
    if (h2Count >= 2) { score += 20; checks.push({ label: 'Subheadings (2+)', pass: true, action: 'Perfect.' }); }
    else { checks.push({ label: 'Subheadings', pass: false, action: 'Add at least 2 sections (##).' }); }

    // Links (1+)
    if (linkCount >= 1) { score += 20; checks.push({ label: 'Links', pass: true, action: 'Perfect.' }); }
    else { checks.push({ label: 'Links', pass: false, action: 'Add 1 link like [text](url).' }); }

    // Readability
    if (longParagraphs === 0) { score += 20; checks.push({ label: 'Readability', pass: true, action: 'Perfect.' }); }
    else { checks.push({ label: 'Readability', pass: false, action: `Break up ${longParagraphs} long paragraphs.` }); }

    // Formatting
    if (boldCount >= 2) { score += 20; checks.push({ label: 'Formatting (Bold)', pass: true, action: 'Perfect.' }); }
    else { checks.push({ label: 'Formatting', pass: false, action: 'Bold at least 2 key terms with **text**.' }); }

    setAudit({ score, checks, wordCount });
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(converted);
    alert('✅ Text copied! Now paste it into the Article Engine.');
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📄 Doc Importer & Auto-Fixer</h1>
        <p className="text-xs text-gray-500">Paste your Google Doc. We will format it and score it.</p>
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">1. Paste from Google Docs</label>
          <textarea 
            className="w-full p-3 rounded-xl border border-gray-200 mt-2 text-sm h-40 outline-none focus:ring-2 focus:ring-forest-500" 
            placeholder="Paste your text here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        <button onClick={processAndFix} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
          🪄 Convert & Fix Article
        </button>

        {audit && (
          <div className="mt-6 border-t border-gray-200 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-forest-800">SEO Readiness</p>
              <p className={`text-2xl font-extrabold ${audit.score >= 80 ? 'text-green-600' : audit.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {audit.score}/100
              </p>
            </div>
            
            <div className="space-y-3 bg-gray-50 p-3 rounded-xl">
              {audit.checks.map((c: any, i: number) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={c.pass ? 'text-green-500' : 'text-red-500'}>{c.pass ? '✅' : '❌'}</span>
                    <span className={c.pass ? 'text-gray-700 font-bold' : 'text-red-600 font-bold'}>{c.label}</span>
                  </div>
                  {!c.pass && <p className="text-[10px] text-gray-500 ml-6">👉 {c.action}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {converted && (
          <div className="space-y-2 mt-4">
            <label className="text-xs font-bold text-gray-500 uppercase">2. Your Fixed Markdown</label>
            <p className="text-[10px] text-gray-400 mb-2">We automatically added ## to your headers. You just need to add your links.</p>
            <textarea 
              className="w-full p-3 rounded-xl border-2 border-green-500 bg-green-50 text-sm h-60 font-mono outline-none" 
              readOnly
              value={converted}
            />
            <button onClick={copyToClipboard} className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
              📋 Copy to Article Engine
            </button>
          </div>
        )}
      </div>

      <div className="text-center">
        <Link href="/admin" className="text-xs font-bold text-forest-600 hover:underline">← Back to Admin Console</Link>
      </div>
    </div>
  );
}