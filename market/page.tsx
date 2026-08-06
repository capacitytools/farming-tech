import { createClient } from "@/lib/supabase/server";

export default async function TribeDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: tribe } = await supabase.from("tribes").select("*").eq("slug", params.slug).single();
  
  if (!tribe) return <div className="p-8 text-center">Tribe not found</div>;

  const { data: posts } = await supabase
    .from("tribe_posts")
    .select("*, profiles(full_name, avatar_url)")
    .eq("tribe_id", tribe.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <span className="text-6xl">{tribe.icon}</span>
        <h1 className="text-3xl font-bold mt-2">{tribe.name}</h1>
        <p className="text-gray-600">{tribe.description}</p>
        <p className="text-sm text-green-600 font-semibold mt-2">{tribe.member_count} members</p>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Recent Discussions</h2>
      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post: any) => (
            <div key={post.id} className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">
                  {post.profiles?.full_name?.[0] || "?"}
                </div>
                <span className="font-semibold text-sm">{post.profiles?.full_name || "Farmer"}</span>
              </div>
              <p className="text-gray-800">{post.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No posts in this tribe yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}