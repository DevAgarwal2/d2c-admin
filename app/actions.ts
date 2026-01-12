'use server';

import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/supabase-admin";

const ADMIN_EMAIL = process.env.EMAIL!;
const ADMIN_PASS = process.env.PASS!;

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const cookieStore = await cookies();
    cookieStore.set("admin_auth", "true", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 1 day
    });
    redirect("/");
  } else {
    redirect("/login?error=invalid");
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_auth");
  redirect("/login");
}

export async function saveProduct(formData: FormData) {
  const id = formData.get("id") as string | null;
  const imageUrl = formData.get("image") as string;
  
  if (!imageUrl || imageUrl.trim() === "") {
    return { error: "missing_image" };
  }
  
  const imagesJson = formData.get("images") as string;
  const images = imagesJson ? JSON.parse(imagesJson) : [];
  
  const featuresJson = formData.get("features") as string;
  const features = featuresJson ? JSON.parse(featuresJson) : [];
  
  const productData = {
    title: formData.get("title") as string,
    category_id: formData.get("category") as string,
    price: parseFloat(formData.get("price") as string) || 0,
    original_price: parseFloat(formData.get("originalPrice") as string) || 0,
    image_url: imageUrl,
    images: images,
    features: features,
    description: formData.get("description") as string,
    in_stock: formData.get("in_stock") === "on",
    fast_delivery: formData.get("fast_delivery") === "on",
    rating: parseFloat(formData.get("rating") as string) || 5,
    reviews: parseInt(formData.get("reviews") as string) || 0,
  };

  if (id) {
    await adminDb.from("products").update(productData).eq("id", id);
  } else {
    const newId = crypto.randomUUID();
    await adminDb.from("products").insert({ ...productData, id: newId });
  }

  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) {
    throw new Error("Product ID is required");
  }
  
  await adminDb.from("products").delete().eq("id", id);
  
  // Return success - client handles redirect
  return { success: true };
}

export async function saveCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  
  if (!name || name.trim() === "") {
    return { error: "missing_name" };
  }
  
  const id = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const { data: existingCategory } = await adminDb
    .from("categories")
    .select("id")
    .eq("id", id)
    .single();
  
  if (existingCategory) {
    return { error: "duplicate_id" };
  }
  
  await adminDb.from("categories").insert({
    id,
    name,
    description,
    icon: "📁",
  });
  
  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) {
    throw new Error("Category ID is required");
  }
  
  await adminDb.from("categories").delete().eq("id", id);
  
  return { success: true };
}

export async function updateCategoryName(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  
  if (!id) {
    throw new Error("Category ID is required");
  }
  
  if (!name || name.trim() === "") {
    return { error: "missing_name" };
  }
  
  await adminDb.from("categories").update({ name: name.trim() }).eq("id", id);
  
  return { success: true };
}
