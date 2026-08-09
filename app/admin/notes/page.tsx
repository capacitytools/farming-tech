import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminNotes() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>;

  const { data: notes } = await supabase.from("admin_notes").select("id, title, updated_at").order("updated_at", { ascending: false });

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🗒️ Notepad</h1>
        <Link href="/admin/notes/edit" className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold">+ New Note</Link>
      </div>
      <div className="space-y-3">
        {notes && notes.length > 0 ? (
          notes.map((n: any) => (
            <Link key={n.id} href={`/admin/notes/edit?id=${n.id}`} className="glass-card p-4 rounded-2xl block">
              <h3 className="font-bold">{n.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Updated {new Date(n.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-gray-500 text-center py-10">No notes yet. Create your first one!</p>
        )}
      </div>
    </div>
  );
}