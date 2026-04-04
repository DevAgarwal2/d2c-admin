"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { ArrowLeft, Loader2, Youtube, Instagram, ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { IKContext, IKUpload } from "imagekitio-react";

type VideoSource = "youtube" | "instagram" | "imagekit";

type Video = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
};

export default function VideoForm({ video }: { video?: Video | null }) {
  const router = useRouter();
  const isEditing = !!video;
  
  const detectSource = (url: string): VideoSource => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("instagram.com")) return "instagram";
    return "imagekit";
  };
  
  const [title, setTitle] = useState(video?.title || "");
  const [description, setDescription] = useState(video?.description || "");
  const [videoUrl, setVideoUrl] = useState(video?.video_url || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnail_url || "");
  const [displayOrder, setDisplayOrder] = useState(video?.display_order || 0);
  const [isActive, setIsActive] = useState(video?.is_active ?? true);
  const [source, setSource] = useState<VideoSource>(video ? detectSource(video.video_url) : "youtube");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Upload states
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const authenticator = useCallback(async () => {
    const response = await fetch("/api/imagekit/auth");
    if (!response.ok) throw new Error("Authentication failed");
    return response.json();
  }, []);

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    return null;
  };

  const handleSourceChange = (newSource: VideoSource) => {
    setSource(newSource);
    if (newSource !== "imagekit") {
      setVideoUrl("");
      if (!thumbnailUrl || source === "youtube") setThumbnailUrl("");
    }
  };

  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    const detectedSource = detectSource(url);
    if (detectedSource !== source) {
      setSource(detectedSource);
    }
    
    if (!thumbnailUrl && detectedSource === "youtube") {
      const autoThumbnail = getYouTubeThumbnail(url);
      if (autoThumbnail) {
        setThumbnailUrl(autoThumbnail);
      }
    }
  };

  // Video upload success
  const handleVideoUploadSuccess = useCallback((response: any) => {
    setVideoUrl(response.url);
    setIsUploadingVideo(false);
    toast.success("Video uploaded successfully!");
  }, []);

  const handleVideoUploadError = useCallback((err: any) => {
    console.error("Video upload error:", err);
    setIsUploadingVideo(false);
    toast.error("Video upload failed. Please try again.");
  }, []);

  // Thumbnail upload success
  const handleThumbnailUploadSuccess = useCallback((response: any) => {
    setThumbnailUrl(response.url);
    setIsUploadingThumbnail(false);
    toast.success("Thumbnail uploaded successfully!");
  }, []);

  const handleThumbnailUploadError = useCallback((err: any) => {
    console.error("Thumbnail upload error:", err);
    setIsUploadingThumbnail(false);
    toast.error("Thumbnail upload failed. Please try again.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !videoUrl.trim()) {
      toast.error("Title and story video are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoUrl.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        display_order: displayOrder,
        is_active: isActive,
      };

      const url = isEditing ? `/api/videos/${video.id}` : "/api/videos";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(isEditing ? "Story updated successfully" : "Story added successfully");
        router.push("/videos");
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save story");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewThumbnail = () => {
    if (thumbnailUrl) return thumbnailUrl;
    if (source === "youtube") return getYouTubeThumbnail(videoUrl);
    return null;
  };

  const sourceOptions = [
    { value: "youtube" as VideoSource, label: "YouTube", icon: Youtube, color: "text-red-600" },
    { value: "instagram" as VideoSource, label: "Instagram", icon: Instagram, color: "text-pink-600" },
    { value: "imagekit" as VideoSource, label: "Upload Video", icon: ImageIcon, color: "text-blue-600" },
  ];

  return (
    <IKContext
      publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!}
      urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
      authenticator={authenticator}
      transformationPosition="path"
    >
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white sticky top-0 z-10">
          <div className="px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center gap-3 sm:gap-4">
            <Link 
              href="/videos" 
              className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">StoreAdmin</h1>
            <span className="text-slate-400 hidden sm:inline">/</span>
            <span className="text-slate-600 text-sm hidden sm:inline">
              {isEditing ? "Edit Story" : "New Story"}
            </span>
          </div>
        </header>

        <main className="p-3 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {isEditing ? "Edit Artisan Story" : "Add New Artisan Story"}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditing ? "Update your story details" : "Add a new artisan story to showcase your craftsmanship"}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Traditional Brass Making Process"
                  className="h-10"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the video content..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none"
                />
              </div>

              {/* Source Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Story Source</Label>
                <div className="grid grid-cols-3 gap-3">
                  {sourceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSourceChange(option.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          source === option.value
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${option.color}`} />
                        <span className="text-xs font-medium text-slate-700">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Video Input */}
              {source === "imagekit" ? (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Upload Video <span className="text-red-500">*</span>
                  </Label>
                  
                  {!videoUrl ? (
                    <div className="relative">
                      <IKUpload
                        fileName={`story-video-${Date.now()}`}
                        useUniqueFileName={true}
                        isPrivateFile={false}
                        folder="/videos"
                        onSuccess={handleVideoUploadSuccess}
                        onError={handleVideoUploadError}
                        onUploadStart={() => setIsUploadingVideo(true)}
                        accept="video/*"
                        className="hidden"
                        id="ik-upload-video"
                      />
                      <label
                        htmlFor="ik-upload-video"
                        className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
                      >
                        {isUploadingVideo ? (
                          <>
                            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                            <p className="text-sm font-medium text-slate-700">Uploading video...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-slate-400" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-slate-700">Click to upload video</p>
                              <p className="text-xs text-slate-500">MP4, WebM, MOV</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">Video uploaded successfully</p>
                        <p className="text-xs text-green-700 break-all">{videoUrl}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVideoUrl("")}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="videoUrl" className="text-sm font-medium">
                    Story Video URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder={
                      source === "youtube"
                        ? "https://youtube.com/watch?v=... or https://youtu.be/..."
                        : "https://instagram.com/p/... or https://instagram.com/reel/..."
                    }
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    {source === "youtube" && "Paste any YouTube video link. Thumbnail auto-generated."}
                    {source === "instagram" && "Paste Instagram post or reel link."}
                  </p>
                </div>
              )}

              {/* Thumbnail Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Thumbnail Image
                  {source === "youtube" && <span className="text-slate-400 font-normal"> (Optional - auto-generated from YouTube)</span>}
                </Label>
                
                {thumbnailUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={thumbnailUrl} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl("")}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <IKUpload
                      fileName={`story-thumbnail-${Date.now()}`}
                      useUniqueFileName={true}
                      isPrivateFile={false}
                      folder="/thumbnails"
                      onSuccess={handleThumbnailUploadSuccess}
                      onError={handleThumbnailUploadError}
                      onUploadStart={() => setIsUploadingThumbnail(true)}
                      accept="image/*"
                      className="hidden"
                      id="ik-upload-thumbnail"
                    />
                    <label
                      htmlFor="ik-upload-thumbnail"
                      className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      {isUploadingThumbnail ? (
                        <>
                          <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                          <p className="text-sm font-medium text-slate-700">Uploading thumbnail...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-slate-400" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-700">Click to upload thumbnail</p>
                            <p className="text-xs text-slate-500">JPG, PNG, WebP</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="displayOrder" className="text-sm font-medium">
                  Display Order
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="h-10 w-32"
                  min={0}
                />
                <p className="text-xs text-slate-500">
                  Lower numbers appear first. Videos are sorted by this order.
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked as boolean)}
                />
                <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                  Story is visible on the website
                </Label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/videos")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploadingVideo || isUploadingThumbnail || (source === "imagekit" && !videoUrl)}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isEditing ? "Update Story" : "Add Story"
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </IKContext>
  );
}
