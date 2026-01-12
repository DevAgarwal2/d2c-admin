import { adminDb } from "@/lib/supabase-admin";
import CategoriesClient from "./CategoriesClient";

export const dynamic = 'force-dynamic';

async function getCategories() {
  const { data } = await adminDb.from("categories").select("*").order("id", { ascending: true });
  return data || [];
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient initialCategories={categories} />;
}
