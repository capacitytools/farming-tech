import { createClient } from '@/lib/supabase/server';

/**
 * Server component that reads Adsterra scripts stored by the admin
 * (via Admin > Settings > Ad Code Injection) and injects them into the page.
 * Scripts are stored as raw strings in admin_settings and rendered with
 * dangerouslySetInnerHTML — ONLY the admin (role-gated) can write to this table,
 * enforced by the RLS policy in schema.sql.
 */
export default async function AdsterraInjector({
  slot,
}: {
  slot: 'native' | 'push' | 'banner';
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from('admin_settings')
    .select('adsterra_native_script, adsterra_push_script, adsterra_banner_script')
    .eq('id', 1)
    .single();

  const scriptMap = {
    native: data?.adsterra_native_script,
    push: data?.adsterra_push_script,
    banner: data?.adsterra_banner_script,
  };

  const script = scriptMap[slot];

  if (!script) return null;

  return (
    <div
      id={`adsterra-${slot}`}
      className="w-full flex justify-center"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
