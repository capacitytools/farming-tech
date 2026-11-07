'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocImporterPage() {
  const [rawText, setRawText] = useState('');
  const [converted, setConverted] = useState('');

  function convertToMarkdown() {
    if (!rawText.trim()) return;

    // Use the browser's built-in HTML parser to read the clipboard data
    const doc = new DOMParser().parseFromString(rawText, 'text/html');
    let md = '';

    // Walk through the HTML elements
    const elements = doc.body.children;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const tag = el.tagName.toLowerCase();

      if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
        md += `## ${el.textContent?.trim()}\n\n`;
      } else if (tag === 'ul') {
        const items = el.querySelectorAll('li');
        items.forEach(li => { md += `- ${li.textContent?.trim()}\n`; });
        md += '\n';
      } else if (tag === 'ol') {
        const items = el.querySelectorAll('li');
        items.forEach((li, idx) => { md += `${idx + 1}. ${li.textContent?.trim()}\n`; });
        md += '\n';
      } else if (tag === 'p') {
        // Handle links and bold text inside paragraphs
        let pText = el.innerHTML;
        
        // Convert <a> to markdown [text](url)
        pText = pText.replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g, '[$2]($1)');
        // Convert <strong> to **text**
        pText = pText.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
        // Convert <em> to *text*
        pText = pText.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');
        
        // Strip remaining HTML tags
        const temp = document.createElement('div');
        temp.innerHTML = pText;
        
        if (temp.textContent?.trim()) {
          md += `${temp.innerHTML.trim()}\n\n`;
        }
      }
    }

    // Clean up empty lines
    md = md.replace(/\n{3,}/g, '\n\n');
    setConverted(md.trim());
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(converted);
    alert('✅ Markdown copied! Ready to paste into the Article Engine.');
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📄 Google Doc Importer</h1>
        <p className="text-xs text-gray-500">Paste your formatted Google Doc here to convert it to clean Markdown.</p>
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

        <button onClick={convertToMarkdown} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
          🪄 Convert to Markdown
        </button>

        {converted && (
          <div className="space-y-2">
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