const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://anrhiecoufjmeqfpostm.supabase.co',
  'sb_publishable_dQhUNmBs4INRcU6oYh1Vww_jvOgtErO'
);

// Product groups to merge
const productGroups = [
  {
    baseName: "Antique Brass Horse Box",
    baseId: "antique-brass-horse-box",
    variants: [
      { id: "antique-brass-horse-box-small", size: "Small", price: 1550 },
      { id: "antique-brass-horse-box-big", size: "Big", price: 2250 }
    ]
  },
  {
    baseName: "Wooden Hanging Planter",
    baseId: "wooden-hanging-planter",
    variants: [
      { id: "wooden-hanging-planter-small", size: "Small", price: 2050 },
      { id: "wooden-hanging-planter-big", size: "Big", price: 2490 }
    ]
  }
];

async function mergeProducts() {
  console.log('🔄 Merging products with size variants...\n');
  
  for (const group of productGroups) {
    console.log(`\n🎯 Processing: ${group.baseName}`);
    
    // 1. Get data from first variant to use as base
    const { data: firstVariant, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', group.variants[0].id)
      .single();
    
    if (fetchError) {
      console.log(`❌ Error fetching ${group.variants[0].id}:`, fetchError);
      continue;
    }
    
    // 2. Get all variants data
    const variantDetails = [];
    for (const variant of group.variants) {
      const { data: vData, error: vError } = await supabase
        .from('products')
        .select('id, price, in_stock, title')
        .eq('id', variant.id)
        .single();
      
      if (vError) {
        console.log(`❌ Error fetching variant ${variant.id}:`, vError);
        continue;
      }
      
      variantDetails.push({
        size: variant.size,
        price: vData.price,
        in_stock: vData.in_stock
      });
    }
    
    // 3. Create new merged product
    const newProduct = {
      ...firstVariant,
      id: group.baseId,
      title: group.baseName,
      price: Math.min(...variantDetails.map(v => v.price)), // Set minimum price as base
      has_sizes: true,
      size_variants: variantDetails,
      created_at: new Date().toISOString()
    };
    
    // Remove old ID and other fields that shouldn't be duplicated
    delete newProduct.created_at;
    
    // 4. Insert new merged product
    const { error: insertError } = await supabase
      .from('products')
      .insert(newProduct);
    
    if (insertError) {
      console.log(`❌ Error creating merged product ${group.baseId}:`, insertError);
      continue;
    }
    
    console.log(`✅ Created: ${group.baseName}`);
    console.log(`   Sizes: ${variantDetails.map(v => v.size).join(', ')}`);
    console.log(`   Price range: ₹${Math.min(...variantDetails.map(v => v.price))} - ₹${Math.max(...variantDetails.map(v => v.price))}`);
    
    // 5. Delete old variants
    for (const variant of group.variants) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', variant.id);
      
      if (deleteError) {
        console.log(`❌ Error deleting ${variant.id}:`, deleteError);
      } else {
        console.log(`   🗑️ Deleted: ${variant.id}`);
      }
    }
  }
  
  console.log('\n✅ Migration complete!');
}

mergeProducts().catch(console.error);
