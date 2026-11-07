'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocImporterPage() {
  const [rawText, setRawText] = useState('');
  const [converted, setConverted] = useState('');
  
  // SEO Audit State
  const [audit, setAudit] = useState<any>(null);

  function convertAndAudit() {
    if (!rawText.trim()) return;

    // 1. Convert HTML to Markdown
    const doc = new DOMParser().parseFromString(rawText, 'text/html');
    let md = '';
    let wordCount = 0;
    let linkCount = 0;
    let h2Count = 0;
    let longParagraphs = 0;

    const elements = doc.body.children;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const tag = el.tagName.toLowerCase();

      if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
        md += `## ${el.textContent?.trim()}\n\n`;
        if (tag === 'h2') h2Count++;
      } else if (tag === 'ul') {
        const items = el.querySelectorAll('li');
        items.forEach(li => { md += `- ${li.textContent?.trim()}\n`; });
        md += '\n';
      } else if (tag === 'ol') {
        const items = el.querySelectorAll('li');
        items.forEach((li, idx) => { md += `${idx + 1}. ${li.textContent?.trim()}\n`; });
        md += '\n';
      } else if (tag === 'p') {
        let pText = el.innerHTML;
        // Count links
        const links = pText.match(/<a /g);
        if (links) linkCount += links.length;

        // Convert HTML to markdown
        pText = pText.replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g, '[$2]($1)');
        pText = pText.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
        pText = pText.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');
        
        const temp = document.createElement('div');
        temp.innerHTML = pText;
        
        if (temp.textContent?.trim()) {
          md += `${temp.innerHTML.trim()}\n\n`;
          // Audit: count words and check paragraph length
          const pWords = temp.textContent.trim().split(/\s+/).length;
          wordCount += pWords;
          if (pWords > 100) longParagraphs++;
        }
      }
    }

    md = md.replace(/\n{3,}/g, '\n\n');
    setConverted(md.trim());

    // 2. Calculate SEO Score
    const checks = [];
    let score = 0;

    // Word Count (Ideal: 600+)
    if (wordCount >= 600) { score += 20; checks.push({ label: 'Length (600+ words)', pass: true }); }
    else { checks.push({ label: `Length (${wordCount} words, aim for 600+)`, pass: false }); }

    // Headings (Ideal: 2+ H2s)
    if (h2Count >= 2) { score += 20; checks.push({ label: 'Subheadings (2+ H2s)', pass: true }); }
    else { checks.push({ label: `Subheadings (${h2Count} found, aim for 2+)`, pass: false }); }

    // Links (Ideal: 1+ internal/external)
    if (linkCount >= 1) { score += 20; checks.push({ label: 'Links (1+ found)', pass: true }); }
    else { checks.push({ label: 'Links (Add 1 internal or affiliate link)', pass: false }); }

    // Readability (Ideal: Short paragraphs)
    if (longParagraphs === 0) { score += 20; checks.push({ label: 'Readability (Paragraphs are short)', pass: true }); }
    else { checks.push({ label: `Readability (${longParagraphs} paragraphs are too long)`, pass: false }); }

    // Formatting (At least some bold text)
    if (md.includes('**')) { score += 20; checks.push({ label: 'Formatting (Bold text used)', pass: true }); }
    else { checks.push({ label: 'Formatting (Use bold text for key terms)', pass: false }); }

    setAudit({ score, checks, wordCount });
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(converted);
    alert('✅ Markdown copied! Ready to paste into the Article Engine.');
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📄 Doc Importer & Auditor</h1>
        <p className="text-xs text-gray-500">Paste your Google Doc to convert it and get an instant SEO score.</p>
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">1. Paste from Google Docs</label>
          <textarea 
            className="w-full p-3 rounded-xl border border-gray-200 mt-2 text-sm h-40 outline-none focus:ring-2 focus:ring-forest-500" 
            placeholder="Paste your formatted text here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        <button onClick={convertAndAudit} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
          🪄 Convert & Audit Article
        </button>

        {audit && (
          <div className="mt-6 border-t border-gray-200 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-forest-800">SEO Readiness Score</p>
              <p className={`text-2xl font-extrabold ${audit.score >= 80 ? 'text-green-600' : audit.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {audit.score}/100
              </p>
            </div>
            
            <div className="space-y-2">
              {audit.checks.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={c.pass ? 'text-green-500' : 'text-red-500'}>
                    {c.pass ? '✅' : '❌'}
                  </span>
                  <span className={c.pass ? 'text-gray-700' : 'text-red-600 font-bold'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {converted && (
          <div className="space-y-2 mt-4">
            <label className="text-xs font-bold text-gray-500 uppercase">2. Your Clean Markdown</label>
            <textarea 
              className="w-full p-3 rounded-xl border-2 border-green-500 bg-green-50 text-sm h-60 font-mono outline-none" 
              readOnly
              value={converted}
            />
            <button onClick={copyToClipboard} className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
              📋 Copy for Article Engine
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