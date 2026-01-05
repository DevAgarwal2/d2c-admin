import { adminDb } from "@/lib/supabase-admin";
import ProductForm from "./ProductForm";

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  idx?: number;
};

async function getProduct(id: string) {
  const { data } = await adminDb.from("products").select("*").eq("id", id).single();
  return data ? { 
    ...data, 
    images: data.images || [],
    features: data.features || ["", "", "", "", "", "", ""]
  } : null;
}

async function getCategories() {
  const { data, error } = await adminDb.from("categories").select("*");
  if (error) {
    console.error("Error fetching categories:", error);
  }
  console.log("Categories data:", data);
  return data || [];
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const product = isNew ? undefined : await getProduct(id);
  const categories = await getCategories();

  return <ProductForm product={product} categories={categories} />;
}
