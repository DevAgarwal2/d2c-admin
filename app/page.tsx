import { adminDb } from "@/lib/supabase-admin";
import DashboardClient from "./DashboardClient";

export const dynamic = 'force-dynamic';

async function getProducts() {
  const { data } = await adminDb.from("products").select("*").order("title", { ascending: true });
  return data || [];
}

export default async function DashboardPage() {
  const products = await getProducts();
  return <DashboardClient initialProducts={products} />;
}
