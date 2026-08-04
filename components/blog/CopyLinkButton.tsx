'use client';

import { useState } from 'react';
import { Link2, Check, Share2 } from 'lucide-react';

export default function CopyLinkButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on non-HTTPS/older browsers — fall back silently
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled share sheet — no action needed
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex gap-3">
      <button onClick={handleCopy} className="btn-secondary flex-1">
        {copied ? <Check className="w-4 h-4 text-forest-600" /> : <Link2 className="w-4 h-4" />}
        {copied ? 'Link Copied!' : 'Copy Link'}
      </button>
      <button onClick={handleShare} className="btn-primary flex-1">
        <Share2 className="w-4 h-4" /> Share
      </button>
    </div>
  );
}
