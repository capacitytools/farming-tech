'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BackButton from './BackButton';
import { Sprout, Bell, Mail, Search, Moon, Menu } from 'lucide-react';

export default function TopBar() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-forest-900/90 backdrop-blur-md border-b border-gray-100 dark:border-forest-800">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        
        {/* LEFT: Back Button + Logo */}
        <div className="flex items-center gap-2">
          {!isHome && <BackButton />}
          
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center text-white">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-forest-900 dark:text-white leading-none">Farming Tech</p>
              <p className="text-[10px] font-bold text-forest-400 dark:text-forest-500 leading-none"> & Business</p>
            </div>
          </Link>
        </div>

        {/* RIGHT: Icons (Bell, Mail, Search, Theme, Menu) */}
        <div className="flex items-center gap-3 text-forest-700 dark:text-forest-200">
          <Link href="/notifications"><Bell className="w-5 h-5" /></Link>
          <Link href="/inbox"><Mail className="w-5 h-5" /></Link>
          <Link href="/search"><Search className="w-5 h-5" /></Link>
          <button><Moon className="w-5 h-5" /></button>
          <button><Menu className="w-5 h-5" /></button>
        </div>

      </div>
    </header>
  );
}