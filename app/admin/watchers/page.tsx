'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function WatchersPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [watchers, setWatchers] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setAdmin(p?.role === 'admin');
      }
      const { data } = await supabase.from('blog_watchers').select('*').order('created_at', { ascending: false });
      setWatchers(data || []);
      setLoaded(true);
    }
    load();
  }, []);

  function exportCSV() {
    if (watchers.length === 0) return;
    const headers = ['Name', 'Email', 'Date Joined'];
    const rows = [headers.join(',')];
    watchers.forEach(w => {
      rows.push([`"${w.name || ''}"`, w.email, new Date(w.created_at).toLocaleDateString()].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'blog_watchers.csv';
    link.click();
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-800">👀 Blog Watchers</h1>
          <p className="text-xs text-gray-500">People who commented on your articles.</p>
        </div>
        <button onClick={exportCSV} className="bg-forest-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
          📥 Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {watchers.map((w) => (
          <div key={w.id} className="flex justify-between items-center p-4 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-sm font-bold text-forest-900">{w.name || 'Anonymous'}</p>
              <p className="text-xs text-gray-500">{w.email}</p>
            </div>
            <p className="text-[10px] text-gray-400">{new Date(w.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {watchers.length === 0 && <p className="text-center p-6 text-gray-500">No watchers yet.</p>}
      </div>

      <div className="text-center mt-4">
        <Link href="/admin" className="text-xs font-bold text-forest-600 hover:underline">← Back to Admin Console</Link>
      </div>
    </div>
  );
}