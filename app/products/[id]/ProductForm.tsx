"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { saveProduct, deleteProduct } from "@/app/actions";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Save, Trash2, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { IKContext, IKUpload } from "imagekitio-react";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number;
  category_id: string;
  image_url: string;
  images?: string[];
  features?: string[];
  in_stock: boolean;
  fast_delivery: boolean;
  rating: number;
  reviews: number;
};

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const router = useRouter();
  
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [features, setFeatures] = useState<string[]>(product?.features || ["", "", "", "", ""]);
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageDeleteConfirm, setShowImageDeleteConfirm] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localErrors, setLocalErrors] = useState<{ mainImage?: string; gallery?: string }>({});

  useEffect(() => {
    const imageInput = document.getElementById('image-input') as HTMLInputElement;
    if (imageInput) {
      imageInput.value = imageUrl;
    }
  }, [imageUrl]);

  useEffect(() => {
    const imagesInput = document.getElementById('images-input') as HTMLInputElement;
    if (imagesInput) {
      imagesInput.value = JSON.stringify(images);
    }
  }, [images]);

  useEffect(() => {
    const featuresInput = document.getElementById('features-input') as HTMLInputElement;
    if (featuresInput) {
      const validFeatures = features.filter(f => f.trim() !== "");
      featuresInput.value = JSON.stringify(validFeatures);
    }
  }, [features]);

  const handleMainUploadSuccess = (response: any) => {
    setImageUrl(response.url);
    setIsUploadingMain(false);
    setLocalErrors(prev => ({ ...prev, mainImage: undefined }));
  };

  const handleMainUploadError = (err: any) => {
    console.error("Upload error:", err);
    setIsUploadingMain(false);
  };

  const handleMainUploadStart = () => {
    setIsUploadingMain(true);
  };

  const handleGalleryUploadSuccess = (response: any) => {
    if (images.length >= 3) {
      setLocalErrors(prev => ({ ...prev, gallery: "Maximum 3 gallery images allowed" }));
      setIsUploadingGallery(false);
      return;
    }
    setImages([...images, response.url]);
    setIsUploadingGallery(false);
    setLocalErrors(prev => ({ ...prev, gallery: undefined }));
  };

  const handleGalleryUploadError = (err: any) => {
    console.error("Gallery upload error:", err);
    setIsUploadingGallery(false);
  };

  const handleGalleryUploadStart = () => {
    if (images.length >= 3) {
      setLocalErrors(prev => ({ ...prev, gallery: "Maximum 3 gallery images allowed" }));
      return;
    }
    setIsUploadingGallery(true);
  };

  const removeGalleryImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setLocalErrors(prev => ({ ...prev, gallery: undefined }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const getPlaceholder = (index: number) => {
    const placeholders = [
      "Dimensions: Height: 5 inch, Diameter: 4 inch",
      "Antique brass finish",
      "Traditional craftsmanship",
      "Ceremonial vessel",
      "Decorative appeal",
      "Cultural significance"
    ];
    return placeholders[index] || "Feature description";
  };

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { mainImage?: string; gallery?: string } = {};
    
    if (!imageUrl || imageUrl.trim() === "") {
      newErrors.mainImage = "Main product image is required";
    }
    
    if (Object.keys(localErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }
    
    const form = document.getElementById('product-form') as HTMLFormElement;
    form?.requestSubmit();
  };

  const authenticator = async () => {
    try {
      const response = await fetch('/api/imagekit/auth');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Authenticator error:", error);
      throw error;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl || imageUrl.trim() === "") {
      setLocalErrors(prev => ({ ...prev, mainImage: "Main product image is required" }));
      return;
    }
    
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    setShowSaveConfirm(false);
    setIsSaving(true);
    setSaveSuccess(false);
    setLocalErrors({});
    
    const form = document.getElementById('product-form') as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const result = await saveProduct(formData);
      
      if (result && (result as any).error === "missing_image") {
        setLocalErrors({ mainImage: "Main product image is required" });
        return;
      }
      
      if (result && (result as any).success) {
        toast("Product saved successfully!", {
          description: product ? "Product updated" : "New product created",
        });
        setTimeout(() => {
          router.push('/');
        }, 1500);
        return;
      }
      
      // If we get here, something went wrong
      toast("Failed to save product", {
        description: "Please try again",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast("Failed to save product", {
        description: "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    setShowDeleteConfirm(false);
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      formData.append("id", product?.id || "");
      const result = await deleteProduct(formData);
      
      if (result && (result as any).success) {
        toast("Product deleted", {
          description: `${product?.title} has been deleted`,
        });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast("Failed to delete product", {
        description: "Please try again",
      });
      setTimeout(() => setLocalErrors({}), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setLocalErrors(prev => ({ ...prev, gallery: undefined }));
    setShowImageDeleteConfirm(null);
    
    toast("Image removed", {
      description: "Gallery image has been removed",
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, removed);
    setImages(newImages);
    setDraggedIndex(null);
    
    toast("Image position updated", {
      description: "Gallery order has been changed",
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <IKContext
      publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "public_Wmk2RG+ZVObRGnkh33gD5Nfh70E="}
      urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/pi9wuccc0i"}
      authenticator={authenticator}
      transformationPosition="path"
    >
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                {product ? "Edit Product" : "New Product"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Cancel</Link>
              </Button>
               <Button 
                 type="button" 
                 onClick={() => setShowSaveConfirm(true)}
                 className="gap-2" 
                 disabled={isSaving}
               >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 018-8 8 0 018-8zm2 2a10 10 0 018-10 018 10 0 018-10 10 0 018-10z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> 
                    <span className="hidden sm:inline">Save Changes</span>
                  </>
                )}
              </Button>
              
              <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Save Product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {product ? "Update this product with your changes?" : "Create this new product?"}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowSaveConfirm(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmSave}>Save</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
           {error === "missing_image" && (
             <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
               <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
               <div>
                 <h3 className="font-semibold text-red-800">Error</h3>
                 <p className="text-sm text-red-700">Main product image is required</p>
               </div>
             </div>
           )}

           <form id="product-form" className="max-w-4xl mx-auto space-y-6">
             <input type="hidden" name="id" value={product?.id || ""} />
             <input type="hidden" name="image" id="image-input" value={imageUrl} />
             
             {/* General Information: Title & Description */}
             <Card className="shadow-sm">
               <CardHeader className="pb-4">
                 <CardTitle className="text-lg">General Information</CardTitle>
                 <CardDescription className="text-sm">Basic product details.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="title" className="text-sm font-medium">Product Name</Label>
                   <Input 
                     id="title" 
                     name="title" 
                     defaultValue={product?.title || ""} 
                     placeholder="e.g. Modern Desk Lamp" 
                     required 
                     className="h-10"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                   <textarea 
                     id="description" 
                     name="description"
                     className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                     defaultValue={product?.description || ""}
                   />
                 </div>
               </CardContent>
             </Card>

             {/* Main Image Upload Section */}
             <Card className="shadow-sm">
               <CardHeader className="pb-4">
                 <CardTitle className="text-lg">Product Image *</CardTitle>
                 <CardDescription className="text-sm">Upload primary product image (required).</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 {imageUrl && (
                   <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden bg-slate-100 border">
                     <Image 
                       src={imageUrl} 
                       alt="Product preview"
                       fill
                       className="object-contain"
                     />
                     <button
                       type="button"
                       onClick={() => setImageUrl("")}
                       className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                     >
                       <X className="h-4 w-4" />
                     </button>
                   </div>
                 )}
                 
                 <div className="flex flex-col sm:flex-row gap-3">
                   <IKUpload
                     fileName="main-product-image"
                     useUniqueFileName={true}
                     isPrivateFile={false}
                     onSuccess={handleMainUploadSuccess}
                     onError={handleMainUploadError}
                     onUploadStart={handleMainUploadStart}
                     className="hidden"
                     id="ik-upload-main"
                   />
                   <Button
                     type="button"
                     onClick={() => document.getElementById('ik-upload-main')?.click()}
                     disabled={isUploadingMain}
                     className="gap-2"
                   >
                     <Upload className="h-4 w-4" />
                     {isUploadingMain ? "Uploading..." : "Upload Main Image"}
                   </Button>
                   <Input
                     type="text"
                     placeholder="Or paste ImageKit URL"
                     value={imageUrl}
                     onChange={(e) => {
                       setImageUrl(e.target.value);
                       setLocalErrors(prev => ({ ...prev, mainImage: undefined }));
                     }}
                     className="flex-1"
                   />
                 </div>
                 {localErrors.mainImage && (
                   <p className="text-sm text-red-600 font-medium">{localErrors.mainImage}</p>
                 )}
               </CardContent>
             </Card>

              {/* Gallery Images Section */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Product Gallery</CardTitle>
                  <CardDescription className="text-sm">Upload up to 3 additional product images. Drag to reorder.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 group">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`relative aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 cursor-move transition-all group-hover:border-slate-300 ${
                            draggedIndex === index ? "opacity-50 border-dashed border-blue-500" : "border-transparent"
                          } ${draggedIndex !== null && draggedIndex !== index ? "scale-95" : ""}`}
                        >
                          <Image
                            src={img}
                            alt={`Gallery image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowImageDeleteConfirm(index)}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                 
                 <IKUpload
                   fileName="gallery-image"
                   useUniqueFileName={true}
                   isPrivateFile={false}
                   onSuccess={handleGalleryUploadSuccess}
                   onError={handleGalleryUploadError}
                   onUploadStart={handleGalleryUploadStart}
                   className="hidden"
                   id="ik-upload-gallery"
                 />
                 <Button
                   type="button"
                   onClick={() => document.getElementById('ik-upload-gallery')?.click()}
                   disabled={isUploadingGallery || images.length >= 3}
                   className="gap-2 w-full sm:w-auto"
                 >
                   <Upload className="h-4 w-4" />
                   {isUploadingGallery ? "Uploading..." : `Add Gallery Image (${images.length}/3)`}
                 </Button>
                 <input type="hidden" name="images" id="images-input" />
                 {localErrors.gallery && (
                   <p className="text-sm text-red-600">{localErrors.gallery}</p>
                 )}
               </CardContent>
             </Card>

             {/* Features Section */}
             <Card className="shadow-sm">
               <CardHeader className="pb-4">
                 <CardTitle className="text-lg">Product Features</CardTitle>
                 <CardDescription className="text-sm">Add up to 7 key features for your product.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 {features.map((feature, index) => (
                   <div key={index} className="space-y-2">
                     <Label htmlFor={`feature-${index}`} className="text-sm font-medium">
                       Feature {index + 1}
                     </Label>
                     <Input
                       id={`feature-${index}`}
                       value={feature}
                       onChange={(e) => handleFeatureChange(index, e.target.value)}
                       placeholder={`e.g. ${getPlaceholder(index)}`}
                       className="h-10"
                     />
                   </div>
                 ))}
                 <input type="hidden" name="features" id="features-input" />
               </CardContent>
             </Card>

             {/* Pricing & Category Section */}
             <div className="grid gap-6 sm:grid-cols-2">
               <Card className="shadow-sm">
                 <CardHeader className="pb-4">
                   <CardTitle className="text-lg">Pricing</CardTitle>
                   <CardDescription className="text-sm">Set product pricing.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="price" className="text-sm font-medium">Price (₹)</Label>
                     <Input 
                       id="price" 
                       name="price" 
                       type="number" 
                       step="0.01" 
                       defaultValue={product?.price || ""} 
                       required 
                       className="h-10"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="originalPrice" className="text-sm font-medium">Original Price (₹)</Label>
                     <Input 
                       id="originalPrice" 
                       name="originalPrice" 
                       type="number" 
                       step="0.01" 
                       defaultValue={product?.original_price || ""} 
                       className="h-10"
                     />
                   </div>
                 </CardContent>
               </Card>

               <Card className="shadow-sm">
                 <CardHeader className="pb-4">
                   <CardTitle className="text-lg">Category</CardTitle>
                   <CardDescription className="text-sm">Select product category ({categories.length} available).</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <select
                       id="category"
                       name="category"
                       defaultValue={product?.category_id || ""}
                       required
                       className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                     >
                       <option value="">Select a category...</option>
                       {categories.length === 0 && (
                         <option disabled>Loading categories...</option>
                       )}
                       {categories.map((cat) => (
                         <option key={cat.id} value={cat.id}>
                           {cat.icon} {cat.name}
                         </option>
                       ))}
                     </select>
                   </div>
                 </CardContent>
               </Card>
             </div>

             {/* Inventory & Delivery Section */}
             <Card className="shadow-sm">
               <CardHeader className="pb-4">
                 <CardTitle className="text-lg">Inventory & Delivery</CardTitle>
                 <CardDescription className="text-sm">Stock and delivery options.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="flex items-center gap-3">
                     <input 
                       id="in_stock" 
                       name="in_stock" 
                       type="checkbox" 
                       defaultChecked={product?.in_stock ?? true}
                       className="w-4 h-4 rounded border-slate-300"
                     />
                     <Label htmlFor="in_stock" className="text-sm">In Stock</Label>
                   </div>
                   <div className="flex items-center gap-3">
                     <input 
                       id="fast_delivery" 
                       name="fast_delivery" 
                       type="checkbox" 
                       defaultChecked={product?.fast_delivery ?? false}
                       className="w-4 h-4 rounded border-slate-300"
                     />
                     <Label htmlFor="fast_delivery" className="text-sm">Fast Delivery</Label>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Rating & Reviews Section */}
             <Card className="shadow-sm">
               <CardHeader className="pb-4">
                 <CardTitle className="text-lg">Rating & Reviews</CardTitle>
                 <CardDescription className="text-sm">Product rating and review count.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <Label htmlFor="rating" className="text-sm font-medium">Rating (1-5)</Label>
                     <Input 
                       id="rating" 
                       name="rating" 
                       type="number" 
                       step="0.1" 
                       min="1" 
                       max="5"
                       defaultValue={product?.rating || 5} 
                       className="h-10"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="reviews" className="text-sm font-medium">Reviews Count</Label>
                     <Input 
                       id="reviews" 
                       name="reviews" 
                       type="number" 
                       defaultValue={product?.reviews || 0} 
                       className="h-10"
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>
             
             {product && (
               <div className="flex justify-end pt-4">
                 <Button 
                   variant="outline"
                   type="button"
                   className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                   onClick={() => setShowDeleteConfirm(true)}
                 >
                   <Trash2 className="h-4 w-4" /> Delete Product
                 </Button>
                 
                 <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Delete Product</AlertDialogTitle>
                       <AlertDialogDescription>
                         Are you sure you want to delete "{product.title}"? This action cannot be undone.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
                       <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700 text-white">
                         Delete
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             )}
             
             <AlertDialog open={showImageDeleteConfirm !== null} onOpenChange={(open) => !open && setShowImageDeleteConfirm(null)}>
               <AlertDialogContent>
                 <AlertDialogHeader>
                   <AlertDialogTitle>Remove Image</AlertDialogTitle>
                   <AlertDialogDescription>
                     Are you sure you want to remove this gallery image?
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel onClick={() => setShowImageDeleteConfirm(null)}>Cancel</AlertDialogCancel>
                   <AlertDialogAction onClick={() => showImageDeleteConfirm !== null && confirmRemoveImage(showImageDeleteConfirm)}>
                     Remove
                   </AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
           </form>
        </main>
      </div>
    </IKContext>
  );
}
