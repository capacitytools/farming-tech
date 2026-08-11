'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Bell, Search, Mail, Trophy, Megaphone, Sprout, BookOpen, Stethoscope, ShoppingBag,
  GraduationCap, Info, Phone, Facebook, Instagram, Youtube,
  ChevronRight, Newspaper, User, Wallet, Award,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MENU_SECTIONS = [
  {
    title: 'Explore',
    items: [
      { href: '/feed', label: 'Farmer Timeline', icon: Megaphone },
      { href: '/search', label: 'Search', icon: Search },
      { href: '/leaderboard', label: 'Top Farmers', icon: Trophy },
      { href: '/communities', label: 'Tribes & Communities', icon: Sprout },
      { href: '/blog', label: 'Daily Insight Blog', icon: Newspaper },
      { href: '/scanner', label: 'AI Agri-Doctor', icon: Stethoscope },
      { href: '/market', label: 'Marketplace', icon: ShoppingBag },
      { href: '/experts', label: 'Expert Directory', icon: GraduationCap },
      { href: '/ebooks', label: 'E-book Store', icon: BookOpen },
    ],
  },
  {
    title: 'You',
    items: [
      { href: '/achievements', label: 'My Achievements', icon: Award },
      { href: '/wallet', label: 'Wallet & Verification', icon: Wallet },
      { href: '/inbox', label: 'Inbox / Messages', icon: Mail },
      { href: '/profile', label: 'My Dashboard', icon: User },
    ],
  },
  {
    title: 'Support',
    items: [
      { href: '/about', label: 'About Us', icon: Info },
      { href: '/contact', label: 'Contact Admin', icon: Phone },
    ],
  },
];

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const seen = localStorage.getItem('notifSeen') || '1970-01-01T00:00:00Z';
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', seen);
        setNotifCount(count || 0);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count: mc } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('read', false);
          setMsgCount(mc || 0);
        }
      } catch {}
    })();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-forest-900/80 backdrop-blur-xl border-b border-white/40 dark:border-forest-700/40">
        <div className="mx-auto max-w-md flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-forest-900 dark:text-white">Farming Tech</p>
              <p className="text-[10px] font-semibold text-forest-500 -mt-0.5">& Business</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/notifications" aria-label="Notifications" className="relative w-10 h-10 flex items-center justify-center rounded-full active:bg-forest-100 dark:active:bg-forest-800">
              <Bell className="w-5 h-5 text-forest-700 dark:text-forest-200" />
              {notifCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{notifCount}</span>}
            </Link>
            <Link href="/inbox" aria-label="Inbox" className="relative w-10 h-10 flex items-center justify-center rounded-full active:bg-forest-100 dark:active:bg-forest-800">
              <Mail className="w-5 h-5 text-forest-700 dark:text-forest-200" />
              {msgCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{msgCount}</span>}
            </Link>
            <Link href="/search" aria-label="Search" className="w-10 h-10 flex items-center justify-center rounded-full active:bg-forest-100 dark:active:bg-forest-800">
              <Search className="w-5 h-5 text-forest-700 dark:text-forest-200" />
            </Link>
            <button aria-label="Open menu" onClick={() => setOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-forest-100 dark:active:bg-forest-800">              <Menu className="w-6 h-6 text-forest-700 dark:text-forest-200" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-forest-900/50 backdrop-blur-sm" />
            <motion.div initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto bg-white dark:bg-forest-900 rounded-b-3xl shadow-glass max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <p className="app-heading">Menu</p>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="w-9 h-9 flex items-center justify-center rounded-full bg-forest-100 dark:bg-forest-800">
                  <X className="w-5 h-5 text-forest-700 dark:text-forest-200" />
                </button>
              </div>

              <div className="px-5 pb-4 space-y-6">
                {MENU_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className="text-xs font-bold uppercase tracking-wider text-forest-400 mb-2 px-1">{section.title}</p>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center justify-between px-3 py-3 rounded-2xl active:bg-forest-50 dark:active:bg-forest-800">
                            <span className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-xl bg-forest-50 dark:forest-800 flex items-center justify-center">
                                <Icon className="w-4.5 h-4.5 text-forest-600 dark:text-gold-400" />
                              </span>
                              <span className="text-sm font-semibold text-forest-800 dark:text-forest-100">{item.label}</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-forest-300" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-forest-100 dark:border-forest-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-forest-400 mb-3 px-1">Follow Us</p>
                  <div className="flex gap-2 px-1">
                    {[
                      { icon: Facebook, href: 'https://www.facebook.com/share/1DLbDWeBd3/' },
                      { icon: Instagram, href: 'https://www.instagram.com/myfarmtech' },
                      { icon: Youtube, href: 'https://youtube.com/@animalstipss' },
                    ].map((s, i) => (
                      <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-forest-50 dark:bg-forest-800 flex items-center justify-center">                        <s.icon className="w-4.5 h-4.5 text-forest-600 dark:text-forest-200" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}