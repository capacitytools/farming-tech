'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X, User, Shield, LogOut, FileText, Video, ShoppingBag, BookOpen, MessageSquare, Home, DollarSign, Link2, TrendingUp, Settings } from 'lucide-react';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <>
      {/* The Trigger Button (Hamburger) */}
      <button onClick={() => setOpen(true)} className="p-1.5 active:scale-90 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>

      {/* The Slide-out Menu */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-forest-900 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-forest-800 flex justify-between items-center bg-forest-50 dark:bg-forest-950">
              <p className="font-extrabold text-forest-900 dark:text-white">Menu</p>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-forest-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                <Home className="w-4 h-4 text-forest-600" /> Home
              </Link>
              <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-forest-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                <User className="w-4 h-4 text-forest-600" /> My Profile
              </Link>
              <Link href="/blog" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-forest-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                <FileText className="w-4 h-4 text-forest-600" /> Main Blog
              </Link>
              <Link href="/dashboard/blog" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-forest-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                <FileText className="w-4 h-4 text-forest-600" /> My Blog Studio
              </Link>
              <Link href="/reels" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-forest-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                <Video className="w-4 h-4 text-forest-600" /> Agri-Reels
              </Link>
              <Link href="/market" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-forest-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                <ShoppingBag className="w-4 h-4 text-forest-600" /> Marketplace
              </Link>
              <Link href="/ebooks" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-forest-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                <BookOpen className="w-4 h-4 text-forest-600" /> E-books
              </Link>
              <Link href="/ai-farm" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-forest-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                <MessageSquare className="w-4 h-4 text-forest-600" /> AI Farm Hub
              </Link>
              
              {/* 🚨 MONETIZATION SECTION 🚨 */}
              <div className="border-t border-gray-100 dark:border-forest-800 my-2 pt-2">
                 <p className="px-3 pb-1 text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">💰 Monetization</p>
                 <Link href="/dashboard/affiliates" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-forest-800 text-sm font-bold text-amber-800 dark:text-amber-400">
                  <Link2 className="w-4 h-4" /> My Affiliate Vault
                </Link>
                <Link href="/admin/affiliates" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-forest-800 text-sm font-bold text-amber-800 dark:text-amber-400">
                  <DollarSign className="w-4 h-4" /> Admin Affiliates
                </Link>
              </div>

              {/* 🚨 ADMIN SECTION 🚨 */}
              <div className="border-t border-gray-100 dark:border-forest-800 my-2 pt-2">
                 <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-forest-50 dark:hover:bg-forest-800 text-sm font-bold text-forest-700 dark:text-forest-300">
                  <Shield className="w-4 h-4" /> Admin Console
                </Link>
              </div>
            </div>

            {/* Footer (Logout) */}
            <div className="p-4 border-t border-gray-100 dark:border-forest-800">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}