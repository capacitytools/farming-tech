'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, ShoppingBag, User, Sprout, Newspaper } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/blog', label: 'Blog', icon: Newspaper },
  { href: '/ai-farm', label: 'AI Farm', icon: Sprout, highlight: true },
  { href: '/market', label: 'Market', icon: ShoppingBag },
  { href: '/reels', label: 'Reels', icon: Film },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const seen = localStorage.getItem('notifSeen') || '1970-01-01T00:00:00Z';
          const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).gt('created_at', seen);
          setNotifCount(count || 0);
        }
      } catch {}
    })();
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-forest-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-forest-800 shadow-lg">
      <div className="max-w-2xl mx-auto px-1 py-2">
        <div className="flex items-end justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            if (item.highlight) {
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 text-white shadow-lg -mt-5 active:scale-95">
                  <Icon className="w-5 h-5 text-gold-400" />
                  <span className="text-[8px] font-extrabold">AI Farm</span>
                </Link>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl active:scale-95 ${isActive ? 'text-forest-700 dark:text-forest-200' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.href === '/feed' && notifCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>
                  )}
                </div>
                <span className="text-[8px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}