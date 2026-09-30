'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Film, ShoppingBag, User, Sprout, Bell, Search, Trophy,
  BookOpen, Stethoscope, GraduationCap, Info, Phone, Facebook,
  Instagram, Youtube, ChevronRight, Newspaper, Wallet, Award,
  Megaphone, Moon, Sun
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/reels', label: 'Reels', icon: Film },
  { href: '/ai-farm', label: 'AI Farm', icon: Sprout, highlight: true },
  { href: '/market', label: 'Market', icon: ShoppingBag },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);
        setNotifCount(count || 0);
      }
    })();
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-forest-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-forest-800 shadow-lg">
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                  item.highlight
                    ? 'bg-gradient-to-br from-forest-600 to-forest-800 text-white shadow-lg scale-110 -mt-4'
                    : isActive
                      ? 'bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-200'
                      : 'text-gray-500 dark:text-gray-400 hover:text-forest-600 dark:hover:text-forest-300'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${item.highlight ? 'text-gold-400' : ''}`} />
                  {item.href === '/feed' && notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold ${item.highlight ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}