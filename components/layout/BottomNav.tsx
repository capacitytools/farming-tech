'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Users, ScanLine, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/communities', label: 'Tribes', icon: Users },
  { href: '/scanner', label: 'Scan', icon: ScanLine, isCenter: true },
  { href: '/market', label: 'Market', icon: ShoppingBag },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-md">
        <div className="flex items-end justify-between gap-1 bg-white/85 dark:bg-forest-900/85 backdrop-blur-xl border-t border-white/40 dark:border-forest-700/40 shadow-app-nav rounded-t-3xl px-3 pt-2 pb-2">
          {TABS.map((tab) => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            if (tab.isCenter) {
              return (
                <Link key={tab.href} href={tab.href} className="flex flex-col items-center -mt-6 relative">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      'flex items-center justify-center w-14 h-14 rounded-full shadow-glass border-4 border-white dark:border-forest-900',
                      isActive
                        ? 'bg-gold-500 text-forest-900'
                        : 'bg-forest-600 text-white'
                    )}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                  </motion.div>
                  <span className={cn(
                    'text-[11px] font-bold mt-1',
                    isActive ? 'text-forest-700 dark:text-gold-400' : 'text-forest-400'
                  )}>
                    {tab.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1 py-2 px-2 flex-1 min-w-0"
              >
                <motion.div whileTap={{ scale: 0.85 }} className="relative">
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      isActive ? 'text-forest-600 dark:text-gold-400' : 'text-forest-300 dark:text-forest-600'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-forest-600 dark:bg-gold-400"
                    />
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-[11px] font-semibold truncate',
                    isActive ? 'text-forest-700 dark:text-gold-400' : 'text-forest-400 dark:text-forest-600'
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
