'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  function handleBack() {
    // 1. Check if the user came from within the app
    if (window.history.length > 2) {
      router.back();
    } else {
      // 2. Fallback: If they landed directly on the article, send them to the blog home
      if (pathname.includes('/blog/')) {
        router.push('/blog');
      } else {
        router.push('/');
      }
    }
  }

  return (
    <button 
      onClick={handleBack} 
      className="flex items-center gap-1 text-forest-700 dark:text-forest-200 text-sm font-bold p-2 active:opacity-50 transition-opacity"
    >
      <ArrowLeft className="w-5 h-5" />
      <span>Back</span>
    </button>
  );
}