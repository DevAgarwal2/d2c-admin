import { adminDb } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, video_url, thumbnail_url, display_order, is_active } = body;

    if (!title || !video_url) {
      return NextResponse.json(
        { message: "Title and video URL are required" },
        { status: 400 }
      );
    }

    const { data, error } = await adminDb
      .from("videos")
      .insert({
        title,
        description,
        video_url,
        thumbnail_url,
        display_order: display_order || 0,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating video:", error);
      return NextResponse.json(
        { message: "Failed to create video" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/videos:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
