import { adminDb } from "@/lib/supabase-admin";

const categories = [
  {
    id: "brass-dhoopdani",
    name: "Brass Dhoopdani (Incense Holders)",
    description: "Traditional brass incense holders and dhoopdani",
    icon: "🔴",
    idx: 0,
  },
  {
    id: "brass-products",
    name: "Brass Products",
    description: "Traditional brass boxes, vessels, and storage containers",
    icon: "🟡",
    idx: 1,
  },
  {
    id: "iron-lamps",
    name: "Iron Lamps",
    description: "Traditional iron lamps and lighting fixtures",
    icon: "🟢",
    idx: 2,
  },
  {
    id: "paintings",
    name: "Paintings",
    description: "Traditional handcrafted paintings",
    icon: "🎨",
    idx: 3,
  },
  {
    id: "wooden-products",
    name: "Wooden Products",
    description: "Traditional Wooden Products",
    icon: "🟤",
    idx: 4,
  },
];

async function seedCategories() {
  console.log("Seeding categories...");
  
  for (const category of categories) {
    const { error } = await adminDb.from("categories").upsert(category, {
      onConflict: "id",
    });
    
    if (error) {
      console.error(`Error inserting ${category.id}:`, error);
    } else {
      console.log(`✓ Inserted: ${category.name}`);
    }
  }
  
  console.log("\nDone! Categories have been added to your database.");
}

seedCategories().catch(console.error);
