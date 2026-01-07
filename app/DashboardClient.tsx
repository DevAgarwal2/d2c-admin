"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { logout } from "@/app/actions";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

type Product = {
  id: string;
  title: string;
  category_id: string;
  price: number;
  in_stock: boolean;
  image_url: string;
};

export default function DashboardClient({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(initialProducts);

  // Debounced search
  useState(() => {
    const timer = setTimeout(() => {
      if (search.trim() === "") {
        setProducts(initialProducts);
      } else {
        const filtered = initialProducts.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase())
        );
        setProducts(filtered);
      }
    }, 300);

    return () => clearTimeout(timer);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="px-3 sm:px-6 lg:px-8 h-auto py-3 sm:h-16 sm:py-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">StoreAdmin</h1>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-between sm:justify-end">
            <div className="relative flex-1 max-w-[200px] sm:max-w-xs md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.trim() === "") {
                    setProducts(initialProducts);
                  } else {
                    const filtered = initialProducts.filter((p) =>
                      p.title.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    setProducts(filtered);
                  }
                }}
                placeholder="Search..." 
                className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-slate-400 h-9 sm:h-10 text-sm"
              />
            </div>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit" className="text-sm px-2 sm:px-3">Logout</Button>
            </form>
          </div>
        </div>
      </header>

      <main className="p-3 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Products</h2>
            <p className="text-slate-500 text-sm">Manage your store inventory and details.</p>
          </div>
          <Button size="sm" className="gap-2 w-full sm:w-auto" asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[80px] font-semibold text-slate-900">Image</TableHead>
                  <TableHead className="font-semibold text-slate-900">Title</TableHead>
                  <TableHead className="font-semibold text-slate-900">Category</TableHead>
                  <TableHead className="font-semibold text-slate-900">Price</TableHead>
                  <TableHead className="font-semibold text-slate-900">Stock</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      {product.image_url ? (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100">
                          <Image 
                            src={product.image_url} 
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                          No img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{product.title}</TableCell>
                    <TableCell className="text-slate-600">{product.category_id}</TableCell>
                    <TableCell className="text-slate-900 font-medium">₹{product.price}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        product.in_stock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {product.in_stock ? "In Stock" : "Out of Stock"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/products/${product.id}`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {products.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                {search ? `No products found for "${search}"` : "No products found."}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {products.map((product) => (
                  <div key={product.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {product.image_url ? (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 shrink-0">
                          <Image 
                            src={product.image_url} 
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                          No img
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">{product.title}</h3>
                        <p className="text-sm text-slate-500">{product.category_id}</p>
                        <p className="text-sm font-medium text-slate-900">₹{product.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        product.in_stock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {product.in_stock ? "In Stock" : "Out of Stock"}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/products/${product.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
