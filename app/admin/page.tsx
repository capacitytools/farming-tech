import { createClient } from '@/lib/supabase/server';
import { Users, FileText, ShoppingBag, ScanLine, TrendingUp, Clock } from 'lucide-react';

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [
    { count: userCount },
    { count: blogCount },
    { count: listingCount },
    { count: scanCount },
    { data: pendingSellers },
    { data: recentBlogs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('blogs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('livestock_listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('ai_scans').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, role').eq('is_approved', false).in('role', ['seller', 'teacher']).limit(5),
    supabase.from('blogs').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: 'Total Users', value: userCount ?? 0, icon: Users, color: 'bg-forest-600' },
    { label: 'Published Posts', value: blogCount ?? 0, icon: FileText, color: 'bg-gold-500' },
    { label: 'Active Listings', value: listingCount ?? 0, icon: ShoppingBag, color: 'bg-earth-500' },
    { label: 'AI Scans Run', value: scanCount ?? 0, icon: ScanLine, color: 'bg-forest-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 dark:text-white">Overview</h1>
        <p className="text-sm text-forest-400 mt-1">Platform health at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-extrabold text-forest-900 dark:text-white">{s.value.toLocaleString()}</p>
              <p className="text-xs text-forest-400 font-semibold">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <p className="font-bold text-forest-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-forest-500" /> Pending Approvals
          </p>
          {!pendingSellers?.length ? (
            <p className="text-sm text-forest-400">No pending applications 🎉</p>
          ) : (
            <div className="space-y-2">
              {pendingSellers.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-forest-100 dark:border-forest-800 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-forest-800 dark:text-forest-100">{p.full_name}</p>
                    <p className="text-xs text-forest-400 capitalize">{p.role} application</p>
                  </div>
                  <a href="/admin/users" className="text-xs font-bold text-forest-600 dark:text-gold-400">
                    Review →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <p className="font-bold text-forest-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-forest-500" /> Recent Blog Activity
          </p>
          {!recentBlogs?.length ? (
            <p className="text-sm text-forest-400">No posts yet — write your first one!</p>
          ) : (
            <div className="space-y-2">
              {recentBlogs.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-forest-100 dark:border-forest-800 last:border-0">
                  <p className="text-sm font-semibold text-forest-800 dark:text-forest-100 truncate max-w-[70%]">
                    {b.title}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      b.status === 'published'
                        ? 'bg-forest-100 text-forest-700'
                        : 'bg-gold-400/20 text-gold-600'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <a
        href="/admin/blogs/new"
        className="btn-primary inline-flex w-full md:w-auto md:px-10"
      >
        + Write New Blog Post
      </a>
    </div>
  );
}
