'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function MasterFilePage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setAdmin(p?.role === 'admin');
      }

      const [u, s] = await Promise.all([
        supabase.from('profiles').select('full_name, email, whatsapp, created_at').order('created_at', { ascending: false }),
        supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false })
      ]);

      setUsers(u.data || []);
      setSubscribers(s.data || []);
      setLoaded(true);
    }
    load();
  }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function exportMasterCSV() {
    const headers = ['Source', 'Name', 'Email', 'WhatsApp', 'Date'];
    const rows = [headers.join(',')];

    // 1. Add all registered users
    users.forEach(u => {
      rows.push([`"Registered User"`, `"${u.full_name || ''}"`, u.email || '', u.whatsapp || '', new Date(u.created_at).toLocaleDateString()].join(','));
    });

    // 2. Add all newsletter subscribers
    subscribers.forEach(s => {
      rows.push([`"Newsletter Sub"`, `"${s.name || ''}"`, s.email, '', new Date(s.created_at).toLocaleDateString()].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ftb_master_user_file.csv';
    link.click();
    flash('📊 Master File Downloaded!');
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🗂️ Master User File</h1>
        <p className="text-xs text-gray-500">Every registered farmer and newsletter subscriber on the platform.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-extrabold text-forest-800">{users.length}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Registered Users</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-extrabold text-forest-800">{subscribers.length}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Total Subscribers</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl">
        <p className="text-xs text-amber-800 font-bold mb-2">🚨 Export this list to send blast emails about new e-books or AliExpress deals!</p>
        <button onClick={exportMasterCSV} className="w-full bg-amber-500 text-white py-3 rounded-xl text-sm font-extrabold shadow-md active:scale-95">
          📥 Download Master CSV
        </button>
      </div>

      <div className="text-center mt-4">
        <Link href="/admin" className="text-xs font-bold text-forest-600 hover:underline">← Back to Admin Console</Link>
      </div>
    </div>
  );
}