'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import BackButton from './BackButton';
import { Sprout, Bell, Mail, Search, Moon, Sun, Menu } from 'lucide-react';

export default function TopBar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-forest-900 border-b border-gray-100 dark:border-forest-800">
      <div className="max-w-md mx-auto flex items-center justify-between px-2 py-3">
        
        {/* LEFT: Back Button + Logo */}
        <div className="flex items-center gap-1">
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

        {/* RIGHT: All Icons */}
        <div className="flex items-center gap-2 text-forest-700 dark:text-forest-200">
          <Link href="/notifications" className="p-1.5 active:scale-90 transition-transform"><Bell className="w-5 h-5" /></Link>
          <Link href="/inbox" className="p-1.5 active:scale-90 transition-transform"><Mail className="w-5 h-5" /></Link>
          <Link href="/search" className="p-1.5 active:scale-90 transition-transform"><Search className="w-5 h-5" /></Link>
          
          <button onClick={toggleTheme} className="p-1.5 active:scale-90 transition-transform">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          
          {/* Optional: Menu Button */}
          <button className="p-1.5 active:scale-90 transition-transform"><Menu className="w-5 h-5" /></button>
        </div>

      </div>
    </header>
  );
}