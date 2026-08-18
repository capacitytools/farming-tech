import { createClient } from "@/lib/supabase/server";
import FarmerProfileClient from "@/components/FarmerProfileClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const id = params.id;
  let f: any = null;
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
  if (isUuid) {
    const r = await supabase.from("profiles").select("*").eq("id", id).single();
    f = r.data;
  }
  if (!f) {
    const r = await supabase.from("profiles").select("*").eq("referral_code", id).single();
    f = r.data;
  }

  const name = f?.full_name || "Farmer on Farming Tech & Business";
  const desc = f?.bio || "Join, Learn, Grow, Connect & Earn on the ultimate platform for farmers. See this profile and sign up free!";
  const img = f?.cover_url || f?.avatar_url || "https://farming-tech.vercel.app/og-default.jpg";

  return {
    title: name,
    description: desc,
    openGraph: {
      title: name,
      description: desc,
      images: [{ url: img }],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: desc,
      images: [img],
    },
  };
}

export default function FarmerPage(props: any) {
  return <FarmerProfileClient id={props.params.id} />;
}