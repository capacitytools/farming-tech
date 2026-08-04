import Link from 'next/link';
import {
  LayoutDashboard, FileText, Image as ImageIcon, Users,
  Settings, ShoppingBag, GraduationCap, ScanLine, Sprout,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/blogs', label: 'Blog / SEO Posts', icon: FileText },
      { href: '/admin/media', label: 'Media Library', icon: ImageIcon },
    ],
  },
  {
    title: 'Platform',
    items: [
      { href: '/admin/users', label: 'Users & Partners', icon: Users },
      { href: '/admin/listings', label: 'Livestock Listings', icon: ShoppingBag },
      { href: '/admin/teachers', label: 'Expert Teachers', icon: GraduationCap },
      { href: '/admin/scans', label: 'AI Scan Logs', icon: ScanLine },
    ],
  },
  {
    title: 'System',
    items: [{ href: '/admin/settings', label: 'Settings & Ads', icon: Settings }],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="min-h-screen flex bg-forest-50 dark:bg-forest-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-forest-100 dark:border-forest-800 bg-white dark:bg-forest-900/60 backdrop-blur-xl h-screen sticky top-0">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-forest-900 dark:text-white">Farming Tech</p>
            <p className="text-[10px] font-bold text-forest-400 -mt-0.5">ADMIN CONSOLE</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-forest-400 px-3 mb-1.5">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-forest-600 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-800 transition-colors"
                    >
                      <Icon className="w-4.5 h-4.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-forest-100 dark:border-forest-800">
          <p className="text-xs text-forest-400">{user.email}</p>
        </div>
      </aside>

      {/* Mobile top bar for admin (simplified) */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white dark:bg-forest-900 border-b border-forest-100 dark:border-forest-800">
          <p className="font-extrabold text-forest-900 dark:text-white">Admin Console</p>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
