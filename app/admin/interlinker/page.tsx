'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function InterlinkerPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [auditResults, setAuditResults] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoaded(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    // Fetch all published blogs with their content
    const { data: b } = await supabase
      .from('blogs')
      .select('id,title,slug,category,content,primary_keyword')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    const allBlogs = b || [];
    setBlogs(allBlogs);
    
    // 🚨 RUN THE INTERLINK AUDIT (TITLE DETECTION) 🚨
    const results: any[] = [];

    allBlogs.forEach((post) => {
      let inboundLinks = 0;
      
      allBlogs.forEach((otherPost) => {
        if (post.id !== otherPost.id) {
          const content = otherPost.content || '';
          
          // 🚨 SMART DETECTION: Look for the short link OR the full title 🚨
          const shortLink = '/blog/' + post.slug;
          const titleAsLink = post.title; 
          
          if (content.includes(shortLink) || content.includes(titleAsLink)) {
            inboundLinks++;
          }
        }
      });

      // If a post has 0 inbound links, it's orphaned
      if (inboundLinks === 0) {
        const suggestedParents = allBlogs
          .filter(p => p.category === post.category && p.id !== post.id && p.content.includes('##')) 
          .slice(0, 3); 

        results.push({
          post,
          inboundLinks,
          suggestedParents
        });
      }
    });

    results.sort((a, b) => a.inboundLinks - b.inboundLinks);

    setAuditResults(results);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function copyMarkdown(post: any) {
    // It copies the exact link you need to paste
    const markdown = `[${post.title}](/blog/${post.slug})`;
    navigator.clipboard.writeText(markdown);
    flash('📋 Markdown link copied!');
  }

  if (!loaded) return <p className="text-center p-10">Auditing your internal links...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-800">🔗 AI Interlink Audit</h1>
          <p className="text-xs text-gray-500">Find orphaned articles and discover exactly where to link them.</p>
        </div>
        <button onClick={load} className="bg-forest-100 text-forest-800 px-3 py-2 rounded-lg text-xs font-bold">
          🔄 Refresh
        </button>
      </div>

      {msg && <p className="text-xs font-bold text-green-700 mt-1 bg-green-50 p-2 rounded-lg">{msg}</p>}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
        <p className="text-xs font-bold text-blue-800">
          💡 How this works: We check if your article's title or URL is mentioned in other posts. We found <strong>{auditResults.length}</strong> articles that still need links.
        </p>
      </div>

      <div className="space-y-4">
        {auditResults.map((result, index) => (
          <div key={result.post.id} className="glass-card bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-extrabold text-forest-900 leading-tight">{result.post.title}</p>
                <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ No links point here yet.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl space-y-2">
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">How to fix it:</p>
              
              <div className="flex flex-col gap-2">
                <button onClick={() => copyMarkdown(result.post)} className="bg-forest-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform w-full text-left">
                  1. 📋 Copy Markdown Link
                </button>
                <div className="text-[11px] text-gray-700 leading-relaxed">
                  2. Go to one of the suggested articles below and paste it into a relevant paragraph.
                </div>
              </div>
            </div>

            {result.suggestedParents.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">Suggested Parent Articles to edit:</p>
                <div className="space-y-2">
                  {result.suggestedParents.map((parent: any) => (
                    <Link key={parent.id} href={`/admin/blogs/edit/${parent.id}`} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:border-forest-400 transition-colors">
                      <span className="text-xs">📝</span>
                      <p className="text-[11px] font-bold text-forest-800 truncate">{parent.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {auditResults.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-sm font-bold text-forest-800">Perfect Interlinking!</p>
            <p className="text-xs text-gray-500">All your articles have strong internal links.</p>
          </div>
        )}
      </div>

      <div className="text-center">
        <Link href="/admin" className="text-xs font-bold text-forest-600 hover:underline">← Back to Admin Console</Link>
      </div>
    </div>
  );
}