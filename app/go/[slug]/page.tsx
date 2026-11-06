import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default async function GoPage({ params }: { params: { slug: string } }) {
  const supabase = sb();
  
  // 1. Fetch the link
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('slug', params.slug)
    .single();

  // 2. If not found, redirect home
  if (error || !data) {
    redirect('/');
  }

  // 3. Log the click (Fire and forget - don't wait for it so the user redirects instantly)
  supabase
    .from('affiliate_links')
    .update({ clicks: (data.clicks || 0) + 1 })
    .eq('id', data.id)
    .then(); // Execute in background

  // 4. Redirect to the destination
  redirect(data.destination_url);
}