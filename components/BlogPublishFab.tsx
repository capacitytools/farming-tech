'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function BlogPublishFab() {
  const [can, setCan] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          setCan(p?.role === 'admin' || p?.role === 'editor');
        }
      } catch {}
    })();
  }, []);

  if (!can) return null;
  return (
    <Link href="/admin/blogs" className="fixed bottom-24 right-4 z-40 bg-gold-500 text-forest-900 px-4 py-3 rounded-2xl shadow-xl font-extrabold text-xs active:scale-95">
      ✍️ Publish
    </Link>
  );
}