import { adminDb } from "@/lib/supabase-admin";
import DashboardClient from "./DashboardClient";

async function getProducts() {
  const { data } = await adminDb.from("products").select("*").order("title", { ascending: true });
  return data || [];
}

export default async function DashboardPage() {
  const products = await getProducts();
  return <DashboardClient initialProducts={products} />;
}
