"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TribeDetailPage() {
  const [slug, setSlug] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [tribe, setTribe] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profileRole, setProfileRole] = useState("");
  const [myRole, setMyRole] = useState("");
  const [myBanned, setMyBanned] = useState(false);
  const [joined, setJoined] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [replyText, setReplyText] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = profileRole === "admin";
  const isMod = isAdmin || myRole === "master";
  const canPost = !!user && !myBanned && (isAdmin || joined);

  async function load() {
    const supabase = createClient();
    const { data: t } = await supabase.from("tribes").select("*").eq("slug", slug).single();
    setTribe(t);
    if (!t) {
      setLoaded(true);
      return;
    }
    const { data: p } = await supabase
      .from("tribe_posts")
      .select("*, profiles(full_name, avatar_url, role)")
      .eq("tribe_id", t.id)
      .order("created_at", { ascending: false });
    setPosts(p || []);
    const { data: m } = await supabase
      .from("tribe_members")
      .select("*, profiles(full_name, avatar_url, role)")
      .eq("tribe_id", t.id);
    setMembers(m || []);
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {      const { data: prof } = await supabase.from("profiles").select("role").eq("id", u.id).single();
      setProfileRole(prof?.role || "");
      const mine = (m || []).find((x: any) => x.user_id === u.id);
      setJoined(!!mine && !mine.is_banned);
      setMyRole(mine?.role || "");
      setMyBanned(!!mine?.is_banned);
    }
    setLoaded(true);
  }

  useEffect(() => {
    setSlug(decodeURIComponent(window.location.pathname.split("/").pop() || ""));
  }, []);

  useEffect(() => {
    if (slug) load();
  }, [slug]);

  async function uploadImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `tribe-post-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setImage(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
    setBusy(false);
  }

  async function toggleJoin() {
    if (!user) return;
    setBusy(true);
    const supabase = createClient();
    if (joined) await supabase.rpc("leave_tribe", { t_id: tribe.id });
    else await supabase.rpc("join_tribe", { t_id: tribe.id });
    await load();
    setBusy(false);
  }

  async function submitPost(e: any) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("tribe_posts").insert({
      tribe_id: tribe.id,
      author_id: user.id,
      content: content.trim(),
      image_url: image || null,    });
    if (!error) {
      setContent("");
      setImage("");
    } else setMessage(error.message);
    await load();
    setBusy(false);
  }

  async function submitReply(postId: string) {
    if (!replyText.trim() || !user) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("tribe_posts").insert({
      tribe_id: tribe.id,
      author_id: user.id,
      content: replyText.trim(),
      parent_id: postId,
    });
    setReplyText("");
    setReplyTo("");
    await load();
    setBusy(false);
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const supabase = createClient();
    await supabase.from("tribe_posts").delete().eq("id", id);
    load();
  }

  async function setMemberRole(id: string, role: string) {
    const supabase = createClient();
    await supabase.from("tribe_members").update({ role }).eq("id", id);
    load();
  }

  async function toggleBan(id: string, banned: boolean) {
    const supabase = createClient();
    await supabase.from("tribe_members").update({ is_banned: banned }).eq("id", id);
    load();
  }

  async function kick(id: string) {
    if (!confirm("Remove this member from the tribe?")) return;
    const supabase = createClient();
    await supabase.from("tribe_members").delete().eq("id", id);
    await supabase.from("tribes").update({ member_count: Math.max((tribe.member_count || 1) - 1, 0) }).eq("id", tribe.id);
    load();  }

  function badge(post: any) {
    if (post.profiles?.role === "admin") return <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">ADMIN</span>;
    const role = members.find((m) => m.user_id === post.author_id)?.role;
    if (role === "master") return <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">👑 MASTER</span>;
    return null;
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!tribe) return <div className="p-8 text-center text-gray-500">Tribe not found</div>;

  const topPosts = posts.filter((p) => !p.parent_id);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="glass-card p-5 rounded-2xl shadow-lg text-center mb-4">
        {tribe.image_url ? (
          <img src={tribe.image_url} alt={tribe.name} className="w-full h-32 object-cover rounded-xl mb-3" />
        ) : (
          <span className="text-6xl">{tribe.icon}</span>
        )}
        <h1 className="text-2xl font-bold mt-2">{tribe.name}</h1>
        <p className="text-gray-600 text-sm mt-1">{tribe.description}</p>
        <p className="text-sm text-green-600 font-semibold mt-2">👥 {tribe.member_count} members</p>
        {myBanned ? (
          <p className="mt-4 text-red-600 font-semibold">🚫 You are banned from this tribe.</p>
        ) : user ? (
          <button onClick={toggleJoin} disabled={busy} className={`mt-4 px-6 py-2 rounded-xl font-semibold text-white ${joined ? "bg-gray-500" : "bg-green-600"}`}>
            {joined ? "✅ Joined — tap to leave" : "➕ Join this tribe"}
          </button>
        ) : (
          <a href="/login" className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-xl font-semibold">Log in to join & post</a>
        )}
        {isMod && (
          <button onClick={() => setShowManage(!showManage)} className="block mx-auto mt-3 text-sm font-semibold text-purple-700">
            🛡️ {showManage ? "Hide" : "Manage"} members & moderation
          </button>
        )}
      </div>

      {showManage && isMod && (
        <div className="glass-card p-4 rounded-2xl mb-4 border-2 border-purple-200">
          <h2 className="font-bold mb-3 text-purple-700">🛡️ Tribe Management</h2>
          <div className="space-y-2">
            {members.map((m: any) => (
              <div key={m.id} className="bg-white/70 p-3 rounded-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">
                  {m.profiles?.full_name?.[0] || "?"}
                </div>                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{m.profiles?.full_name || "User"}</p>
                  <p className="text-[10px] text-gray-500">
                    {m.profiles?.role === "admin" ? "ADMIN" : m.role === "master" ? "👑 MASTER" : "member"}
                    {m.is_banned && " · 🚫 banned"}
                  </p>
                </div>
                {m.user_id !== user?.id && m.profiles?.role !== "admin" && (
                  <div className="flex gap-1">
                    {isAdmin && (
                      <button onClick={() => setMemberRole(m.id, m.role === "master" ? "member" : "master")} className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        {m.role === "master" ? "Remove 👑" : "Make 👑"}
                      </button>
                    )}
                    <button onClick={() => toggleBan(m.id, !m.is_banned)} className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      {m.is_banned ? "Unban" : "Ban"}
                    </button>
                    <button onClick={() => kick(m.id)} className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      Kick
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {canPost && (
        <form onSubmit={submitPost} className="glass-card p-4 rounded-2xl mb-4">
          <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={3} placeholder={`Share something with ${tribe.name}...`} value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex items-center gap-3 mt-3">
            <label className="text-sm font-semibold text-green-700 cursor-pointer">
              📷 Add photo
              <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
            </label>
            {image && <img src={image} alt="preview" className="h-10 w-10 object-cover rounded-lg" />}
            <button className="ml-auto bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" disabled={busy}>
              📣 Post
            </button>
          </div>
        </form>
      )}
      {user && !canPost && <p className="text-center text-sm text-gray-500 mb-4">Join this tribe to post. 👆</p>}

      {message && <p className="text-sm text-center text-red-600 mb-4">{message}</p>}

      <h2 className="text-xl font-bold mb-4">💬 Discussions</h2>
      <div className="space-y-4">
        {topPosts.length > 0 ? (          topPosts.map((post) => {
            const replies = posts.filter((r) => r.parent_id === post.id).reverse();
            return (
              <div key={post.id} className="glass-card p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">
                    {post.profiles?.full_name?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm">{post.profiles?.full_name || "Farmer"}</span> {badge(post)}
                    <p className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                  {(isMod || post.author_id === user?.id) && (
                    <button onClick={() => deletePost(post.id)} className="text-red-500 text-xs font-semibold">Delete</button>
                  )}
                </div>
                <p className="text-gray-800 text-sm">{post.content}</p>
                {post.image_url && <img src={post.image_url} alt="post" className="mt-2 w-full h-48 object-cover rounded-xl" />}

                {replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 border-green-200 pl-3">
                    {replies.map((r) => (
                      <div key={r.id} className="bg-white/60 p-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{r.profiles?.full_name || "Farmer"}</span> {badge(r)}
                          {(isMod || r.author_id === user?.id) && (
                            <button onClick={() => deletePost(r.id)} className="ml-auto text-red-500 text-[10px] font-semibold">Delete</button>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 mt-1">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {user ? (
                  replyTo === post.id ? (
                    <div className="mt-3 flex gap-2">
                      <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                      <button onClick={() => submitReply(post.id)} className="bg-green-600 text-white px-3 rounded-xl text-sm font-semibold">Send</button>
                      <button onClick={() => setReplyTo("")} className="bg-gray-200 px-3 rounded-xl text-sm">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setReplyTo(post.id)} className="mt-3 text-xs font-semibold text-green-700">💬 Reply</button>
                  )
                ) : null}
              </div>
            );
          })
        ) : (          <p className="text-gray-500 text-center py-4">No posts yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}