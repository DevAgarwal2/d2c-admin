"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Search, GripVertical, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toggleFeatured, reorderFeatured } from "@/app/actions";

type Product = {
  id: string;
  title: string;
  category_id: string;
  price: number;
  in_stock: boolean;
  image_url: string | null;
  is_featured: boolean;
  featured_order: number;
};

const MAX_FEATURED = 12;

export default function CuratedFavoritesClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isReordering, startReorderTransition] = useTransition();

  const featured = useMemo(
    () => products.filter((p) => p.is_featured).sort((a, b) => a.featured_order - b.featured_order),
    [products]
  );
  const available = useMemo(
    () =>
      products
        .filter((p) => !p.is_featured)
        .filter((p) => search.trim() === "" || p.title.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const handleToggle = async (product: Product) => {
    setPendingId(product.id);
    const formData = new FormData();
    formData.append("id", product.id);
    formData.append("current_featured", String(product.is_featured));

    const result = await toggleFeatured(formData);
    setPendingId(null);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              is_featured: !p.is_featured,
              featured_order: !p.is_featured ? nextOrderNumber(prev) : 0,
            }
          : p
      )
    );
    toast.success(product.is_featured ? "Removed from Curated Favorites" : "Added to Curated Favorites");
  };

  const move = (id: string, direction: "up" | "down") => {
    const index = featured.findIndex((p) => p.id === id);
    if (index < 0) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= featured.length) return;

    const reordered = [...featured];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    const withOrder = reordered.map((p, i) => ({ ...p, featured_order: i + 1 }));
    const others = products.filter((p) => !p.is_featured);
    setProducts([...withOrder, ...others]);

    const payload = {
      order: withOrder.map((p) => ({ id: p.id, order: p.featured_order })),
    };
    const formData = new FormData();
    formData.append("order", JSON.stringify(payload.order));

    startReorderTransition(async () => {
      const result = await reorderFeatured(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Order updated");
      }
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          Curated Favorites
        </h2>
        <p className="text-slate-500 text-sm">
          Choose up to {MAX_FEATURED} products to showcase in the &ldquo;Curated Favorites&rdquo; section on the landing page.
          <span className="block sm:inline sm:ml-1">
            Currently featuring: <span className="font-semibold text-slate-900">{featured.length}</span> / {MAX_FEATURED}
          </span>
        </p>
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Featured ({featured.length})
          </h3>
        </div>

        {featured.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-slate-300 p-10 text-center">
            <Star className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No products featured yet. Pick some from below.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {featured.map((product, index) => (
              <div
                key={product.id}
                className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => move(product.id, "up")}
                    disabled={index === 0 || isReordering}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <button
                    onClick={() => move(product.id, "down")}
                    disabled={index === featured.length - 1 || isReordering}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                </div>

                <span className="text-sm font-mono text-slate-400 w-6 text-center shrink-0">
                  {index + 1}
                </span>

                <div className="relative w-14 h-14 rounded-md overflow-hidden bg-slate-100 shrink-0">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">{product.title}</h4>
                  <p className="text-xs text-slate-500 truncate">{product.category_id}</p>
                </div>

                <span className="hidden sm:inline text-sm font-medium text-slate-900 shrink-0">
                  ₹{product.price}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(product)}
                  disabled={pendingId === product.id}
                  className="shrink-0"
                >
                  {pendingId === product.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Remove"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 shrink-0">
            Available ({available.length})
          </h3>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {available.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500 text-sm">
            {search ? `No products match “${search}”` : "All products are featured."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {available.map((product) => {
              const atCap = featured.length >= MAX_FEATURED;
              return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm"
                >
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100 shrink-0">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 text-sm truncate">{product.title}</h4>
                    <p className="text-xs text-slate-500 truncate">
                      {product.category_id} · ₹{product.price}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={atCap ? "outline" : "default"}
                    onClick={() => handleToggle(product)}
                    disabled={atCap || pendingId === product.id}
                    className="shrink-0"
                    title={atCap ? `Limit is ${MAX_FEATURED} products` : "Add to Curated Favorites"}
                  >
                    {pendingId === product.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Feature"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 underline">← Back to dashboard</Link>
      </div>
    </div>
  );
}

function nextOrderNumber(products: Product[]): number {
  const orders = products.filter((p) => p.is_featured).map((p) => p.featured_order);
  return orders.length ? Math.max(...orders) + 1 : 1;
}
