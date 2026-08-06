import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Not logged in</h2>
        <p className="text-gray-500">Please log in to view your profile.</p>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <div className="glass-card p-6 rounded-2xl text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-700 mb-4">
          {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">{profile?.full_name || "Farmer"}</h1>
        <p className="text-gray-500 mb-4">{user.email}</p>
        
        <div className="grid grid-cols-2 gap-4 text-left mt-6 border-t pt-4">
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="font-semibold capitalize">{profile?.role || "farmer"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Location</p>
            <p className="font-semibold">{profile?.location || "Not set"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="font-semibold">{profile?.phone || "Not set"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-semibold text-green-600">
              {profile?.is_approved ? "Approved ✅" : "Pending..."}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-6">{profile?.bio || "No bio added yet."}</p>
      </div>
    </div>
  );
}
