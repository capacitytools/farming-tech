'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';

export default function AdminTeamPage() {
  const [me, setMe] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user);
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (p?.role !== 'admin') { setMe({ ...user, notAdmin: true }); setLoaded(true); return; }
    }
    const { data } = await supabase.from('profiles').select('id, full_name, email, role, referral_code, avatar_url').order('created_at', { ascending: false }).limit(300);
    setRows(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function setRole(id: string, role: string) {
    if (me && id === me.id) return alert('You cannot change your own role.');
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) return alert('Failed: ' + error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, role } : x)));
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading team...</p>;
  if (!me) return <p className="text-center text-gray-500 py-10">Log in as admin first.</p>;
  if (me.notAdmin) return <p className="text-center text-gray-500 py-10">Admin access only.</p>;

  const filtered = rows.filter((r) => (r.full_name || '').toLowerCase().includes(search.toLowerCase()) || (r.email || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-24 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-forest-950">
      <div className="bg-gradient-to-br from-amber-600 to-forest-900 text-white p-5 rounded-b-3xl flex items-center gap-3">
        <Link href="/profile" className="p-2 rounded-full bg-white/10"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-extrabold">👥 Team & Roles</h1>
          <p className="text-[10px] text-amber-100">Add editors who can publish blogs for you</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="glass-card bg-white dark:bg-forest-900 p-3 rounded-2xl text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
          <p><b>member</b> — normal user.</p>
          <p><b>editor</b> — can publish & manage blog posts (Blog Control Room + Article Engine) and sees the Publish button.</p>
          <p><b>admin</b> — full control room including team, money and settings.</p>
          <p className="text-[10px] text-gray-400">New writers register normally on the platform, then you promote them here.</p>
        </div>

        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm" placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />

        {filtered.map((r) => (
          <div key={r.id} className="glass-card bg-white dark:bg-forest-900 p-3 rounded-2xl flex items-center gap-3">
            {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center font-bold text-forest-700">{(r.full_name || '?')[0]}</div>}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-forest-900 dark:text-white truncate">{r.full_name || 'Farmer'}{r.id === me.id ? ' (you)' : ''}</p>
              <p className="text-[9px] text-gray-500 truncate">{r.email}</p>
            </div>
            <select disabled={r.id === me.id} className="p-2 rounded-xl border border-gray-200 text-xs font-bold bg-white" value={r.role || 'member'} onChange={(e) => setRole(r.id, e.target.value)}>
              <option value="member">member</option>
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}