"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Play, Edit, Trash2, Eye, EyeOff, Youtube, Instagram, ImageIcon } from "lucide-react";
import { toast } from "sonner";

type Video = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export default function VideosClient({ initialVideos }: { initialVideos: Video[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
    
    setDeletingId(id);
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setVideos(videos.filter((v) => v.id !== id));
        toast.success("Story deleted successfully");
      } else {
        toast.error("Failed to delete story");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      
      if (response.ok) {
        setVideos(videos.map((v) => 
          v.id === id ? { ...v, is_active: !currentStatus } : v
        ));
        toast.success(currentStatus ? "Story hidden" : "Story is now visible");
      } else {
        toast.error("Failed to update story");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getYouTubeThumbnail = (url: string) => {
    // Extract video ID from YouTube URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const getVideoSource = (url: string) => {
    if (url.includes("youtube") || url.includes("youtu.be")) return "youtube";
    if (url.includes("instagram")) return "instagram";
    return "imagekit";
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "youtube":
        return <Youtube className="h-3 w-3" />;
      case "instagram":
        return <Instagram className="h-3 w-3" />;
      default:
        return <ImageIcon className="h-3 w-3" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "youtube":
        return "YouTube";
      case "instagram":
        return "Instagram";
      default:
        return "Direct";
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Artisan Stories</h2>
          <p className="text-slate-500 text-sm">Manage your craftsmanship videos and artisan stories.</p>
        </div>
        <Button size="sm" className="gap-2" asChild>
          <Link href="/videos/new">
            <Plus className="h-4 w-4" /> Add Video
          </Link>
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No stories yet</h3>
          <p className="text-slate-500 text-sm mb-4">Add your first artisan story to showcase your craftsmanship.</p>
          <Button asChild>
            <Link href="/videos/new">
              <Plus className="h-4 w-4 mr-2" /> Add Video
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, index) => {
            const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.video_url);
            const source = getVideoSource(video.video_url);
            
            return (
              <div 
                key={video.id} 
                className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all ${
                  video.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden group">
                  {thumbnail ? (
                    <img 
                      src={thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Play overlay */}
                  <a 
                    href={video.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Play className="h-6 w-6 text-slate-900 ml-1" />
                    </div>
                  </a>

                  {/* Source badge */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 text-white text-xs px-2 py-1 rounded ${
                    source === 'youtube' ? 'bg-red-600' : 
                    source === 'instagram' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 
                    'bg-stone-700'
                  }`}>
                    {getSourceIcon(source)}
                    <span>{getSourceLabel(source)}</span>
                  </div>

                  {/* Status badge */}
                  {!video.is_active && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">
                      Hidden
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1">{video.title}</h3>
                    <span className="text-xs text-slate-400 font-mono shrink-0">#{index + 1}</span>
                  </div>
                  
                  {video.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{video.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => handleToggleActive(video.id, video.is_active)}
                    >
                      {video.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      asChild
                    >
                      <Link href={`/videos/${video.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(video.id)}
                      disabled={deletingId === video.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
