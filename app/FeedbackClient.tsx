"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Star, Trash2, X, Upload, Edit2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { saveFeedback, deleteFeedback } from "@/app/actions";
import { IKContext, IKUpload } from "imagekitio-react";

type Feedback = {
  id: string;
  customer_name: string;
  title: string;
  description: string | null;
  stars: number;
  image_url: string | null;
  location: string | null;
};

function StarRating({ stars, onChange, interactive }: { stars: number; onChange?: (s: number) => void; interactive?: boolean }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onChange?.(star)}
          onTouchStart={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          disabled={!interactive}
          className={`p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md ${interactive ? "cursor-pointer hover:bg-yellow-50 active:scale-95 transition-all" : ""} focus:outline-none focus:ring-2 focus:ring-yellow-400`}
          aria-label={`${star} stars`}
        >
          <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${star <= (hovered || stars) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackClient({ initialFeedback }: { initialFeedback: Feedback[] }) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);

  const authenticator = useCallback(async () => {
    const response = await fetch("/api/imagekit/auth");
    if (!response.ok) throw new Error("Authentication failed");
    return response.json();
  }, []);

  const handleUploadSuccess = useCallback((response: any) => {
    setImageUrl(response.url);
    setIsUploading(false);
    toast.success("Image uploaded successfully");
  }, []);

  const handleUploadError = useCallback((err: any) => {
    console.error("Upload error:", err);
    setIsUploading(false);
    toast.error("Image upload failed. Please try again.");
  }, []);

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
  }, []);

  const handleEdit = useCallback((item: Feedback) => {
    setEditingId(item.id);
    setImageUrl(item.image_url || "");
    setSelectedStars(item.stars);
    setShowForm(true);
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setImageUrl("");
    setSelectedStars(5);
    setShowForm(false);
  }, []);

  const handleSubmit = useCallback(async (formData: FormData) => {
    setIsSubmitting(true);
    
    const customerName = formData.get("customer_name") as string;
    const title = formData.get("title") as string;

    if (!customerName?.trim() || !title?.trim()) {
      toast.error("Please fill in required fields (Customer Name and Title)");
      setIsSubmitting(false);
      return;
    }

    const location = formData.get("location") as string;

    const submitData = new FormData();
    submitData.append("customer_name", customerName.trim());
    submitData.append("title", title.trim());
    submitData.append("description", (formData.get("description") as string || "").trim());
    submitData.append("location", (location || "").trim());
    submitData.append("image", imageUrl);
    submitData.append("stars", selectedStars.toString());

    if (editingId) {
      submitData.append("id", editingId);
    }

    try {
      const result = await saveFeedback(submitData);
      
      if (result.success) {
        toast.success(editingId ? "Feedback updated successfully" : "Feedback added successfully");
        resetForm();
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to save feedback");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [imageUrl, selectedStars, editingId, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const formData = new FormData();
      formData.append("id", id);
      const result = await deleteFeedback(formData);

      if (result.success) {
        toast.success("Feedback deleted");
        setFeedback(prev => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete feedback");
    }
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Customer Feedback</h2>
          <p className="text-sm text-slate-500">{feedback.length} reviews</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => { setEditingId(null); setImageUrl(""); setSelectedStars(5); setShowForm(true); }} 
          className="gap-2 w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Feedback</span>
          <span className="sm:hidden">Add Review</span>
        </Button>
      </div>

      {showForm && (
        <IKContext
          publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!}
          urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
          authenticator={authenticator}
          transformationPosition="path"
        >
          <form id="feedback-form" action={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900 text-base sm:text-lg">{editingId ? "Edit Feedback" : "New Feedback"}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="min-h-[44px] min-w-[44px]">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-sm font-medium">Customer Name *</Label>
                <Input 
                  id="customer_name" 
                  name="customer_name" 
                  placeholder="John Doe" 
                  required 
                  defaultValue={editingId ? feedback.find(f => f.id === editingId)?.customer_name : ""}
                  className="h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  placeholder="e.g., Ahmedabad, Gujarat" 
                  defaultValue={editingId ? feedback.find(f => f.id === editingId)?.location || "" : ""}
                  className="h-11 sm:h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Review Title *</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Great product!" 
                required 
                defaultValue={editingId ? feedback.find(f => f.id === editingId)?.title : ""}
                className="h-11 sm:h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Write your review..."
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus-visible:ring-slate-400 focus-visible:outline-none resize-y"
                defaultValue={editingId ? feedback.find(f => f.id === editingId)?.description || "" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Rating</Label>
              <div className="flex items-center gap-3">
                <StarRating stars={selectedStars} onChange={setSelectedStars} interactive />
                <span className="text-sm text-slate-500 font-medium">{selectedStars} stars</span>
                <Input type="hidden" name="stars" value={selectedStars} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Image (Optional)</Label>
              <div className="space-y-3">
                {imageUrl && (
                  <div className="relative w-full h-40 sm:h-48 rounded-md overflow-hidden bg-slate-100">
                    <Image 
                      src={imageUrl} 
                      alt="Preview" 
                      fill 
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 active:bg-red-700 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <IKUpload
                  fileName={editingId ? `feedback-${editingId}` : `feedback-new`}
                  useUniqueFileName={true}
                  isPrivateFile={false}
                  onSuccess={handleUploadSuccess}
                  onError={handleUploadError}
                  onUploadStart={handleUploadStart}
                  className="hidden"
                  id="ik-upload-feedback"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("ik-upload-feedback")?.click()}
                  disabled={isUploading}
                  className="gap-2 w-full min-h-[44px]"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : imageUrl ? "Change Image" : "Upload Image"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto min-h-[44px]">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 min-h-[44px]">
                {isSubmitting ? "Saving..." : editingId ? "Update Feedback" : "Save Feedback"}
              </Button>
            </div>
          </form>
        </IKContext>
      )}

      {feedback.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
          <p className="text-slate-500 text-sm">No feedback yet. Add your first review!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {feedback.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 text-sm sm:text-base truncate">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{item.customer_name}</p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 sm:h-8 sm:w-8 text-slate-400 hover:text-blue-500 min-h-[44px] min-w-[44px]" 
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 sm:h-8 sm:w-8 text-slate-400 hover:text-red-500 min-h-[44px] min-w-[44px]" 
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {item.image_url && (
                <div className="relative w-full h-36 sm:h-40 rounded-md overflow-hidden bg-slate-100">
                  <Image 
                    src={item.image_url} 
                    alt="Feedback image" 
                    fill 
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>
              )}

              {item.description && (
                <p className="text-sm text-slate-600 line-clamp-3">{item.description}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <StarRating stars={item.stars} />
                {item.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    <span className="truncate max-w-[100px]">{item.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
