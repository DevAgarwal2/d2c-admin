import { adminDb } from "@/lib/supabase-admin";
import VideoForm from "../VideoForm";

export const metadata = {
  title: "Edit Artisan Story | StoreAdmin",
};

async function getVideo(id: string) {
  const { data } = await adminDb.from("videos").select("*").eq("id", id).single();
  return data;
}

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  return <VideoForm video={video} />;
}
