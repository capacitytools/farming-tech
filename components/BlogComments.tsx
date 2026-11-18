'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function BlogComments({ blogId }: { blogId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('blog_id', blogId)
      .order('created_at', { ascending: false });
    setComments(data || []);
  }

  useEffect(() => { load(); }, [blogId]);

  async function submitComment(e: any) {
    e.preventDefault();
    if (!name || !email || !comment) return alert('Please fill all fields.');
    setBusy(true);

    const supabase = createClient();
    
    // 1. Save the comment
    const { error } = await supabase.from('blog_comments').insert({
      blog_id: blogId,
      name,
      email,
      comment,
    });

    if (error) {
      alert('Error posting comment: ' + error.message);
    } else {
      // 2. Save the email to the watchers list
      await supabase.from('blog_watchers').upsert({ email, name }, { onConflict: 'email' });
      
      setMsg('✅ Comment posted successfully!');
      setName(''); setEmail(''); setComment('');
      load();
      setTimeout(() => setMsg(''), 3000);
    }
    setBusy(false);
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-xl font-extrabold text-forest-900 mb-4">Join the Discussion</h2>
      
      {/* COMMENT FORM */}
      <form onSubmit={submitComment} className="bg-forest-50 p-4 rounded-2xl border border-forest-100 mb-8 space-y-3">
        {msg && <p className="text-xs font-bold text-green-700">{msg}</p>}
        
        <div className="grid grid-cols-2 gap-2">
          <input 
            type="text" 
            placeholder="Your Name" 
            className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500 bg-white" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <input 
            type="email" 
            placeholder="Your Gmail" 
            className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500 bg-white" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        
        <textarea 
          className="w-full p-3 rounded-xl border border-gray-200 text-sm h-24 outline-none focus:ring-2 focus:ring-forest-500 bg-white" 
          placeholder="What are your thoughts on this?" 
          value={comment} 
          onChange={(e) => setComment(e.target.value)} 
        />
        
        <button disabled={busy} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50">
          {busy ? 'Posting...' : '💬 Post Comment'}
        </button>
      </form>

      {/* COMMENTS LIST */}
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center font-bold text-amber-900 flex-shrink-0">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100 w-full">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-extrabold text-forest-900">{c.name}</p>
                <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-sm text-gray-700">{c.comment}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-gray-500 text-center">No comments yet. Be the first to share your thoughts!</p>}
      </div>
    </div>
  );
}