'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UserBlogDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Create Blog State
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return router.push('/login');
    setUser(u);

    const { data } = await supabase.from('user_blogs').select('*').eq('owner_id', u.id).order('created_at', { ascending: false });
    setBlogs(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, [router]);

  async function createBlog(e: any) {
    e.preventDefault();
    if (!newName || !newSlug) return alert('Name and URL Slug are required');
    setBusy(true);
    const supabase = createClient();
    
    const { error } = await supabase.from('user_blogs').insert({
      owner_id: user.id,
      name: newName,
      slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: newDesc,
    });

    if (error) alert(error.message);
    else {
      setShowCreate(false);
      setNewName(''); setNewSlug(''); setNewDesc('');
      load();
    }
    setBusy(false);
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🏢 My Blog Network</h1>
        <p className="text-xs text-gray-500">Manage all your blogs in one place.</p>
      </div>

      <button onClick={() => setShowCreate(!showCreate)} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold shadow-md">
        {showCreate ? 'Cancel' : '➕ Create New Blog'}
      </button>

      {/* CREATE FORM */}
      {showCreate && (
        <form onSubmit={createBlog} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <input className="w-full p-2 rounded-lg border text-sm" placeholder="Blog Name (e.g. John's Poultry Hub)" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }} />
          <input className="w-full p-2 rounded-lg border text-sm bg-gray-50" placeholder="URL Slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
          <textarea className="w-full p-2 rounded-lg border text-sm" placeholder="Blog Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <button disabled={busy} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold">{busy ? 'Creating...' : 'Save Blog'}</button>
        </form>
      )}

      {/* LIST OF BLOGS */}
      <div className="space-y-3">
        {blogs.map(b => (
          <div key={b.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-forest-900">{b.name}</h3>
              <p className="text-[10px] text-gray-500">/u/{user.id.slice(0,6)}/{b.slug}</p>
            </div>
            <Link href={`/dashboard/blog/${b.id}`} className="bg-forest-100 text-forest-800 px-3 py-1.5 rounded-lg text-xs font-bold">Manage →</Link>
          </div>
        ))}
        {blogs.length === 0 && <p className="text-center text-gray-500 text-sm">You haven't created any blogs yet.</p>}
      </div>
    </div>
  );
}