"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { deleteCategory, updateCategoryName } from "@/app/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Folder, Edit2, Save, X } from "lucide-react";
import { useState } from "react";
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

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleDeleteCategory = async (id: string) => {
    try {
      const formData = new FormData();
      formData.append("id", id);
      const result = await deleteCategory(formData);
      
      if (result && (result as any).success) {
        setCategories(categories.filter(c => c.id !== id));
        toast("Category deleted", {
          description: "Category has been removed",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast("Failed to delete category", {
        description: "Please try again",
      });
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEditing = async (id: string) => {
    if (!editingName.trim()) {
      toast("Name cannot be empty", {
        description: "Please enter a category name",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("name", editingName.trim());
      const result = await updateCategoryName(formData);
      
      if (result && (result as any).success) {
        setCategories(categories.map(c => 
          c.id === id ? { ...c, name: editingName.trim() } : c
        ));
        setEditingId(null);
        setEditingName("");
        toast("Category updated", {
          description: "Category name has been updated",
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      toast("Failed to update category", {
        description: "Please try again",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="px-3 sm:px-6 lg:px-8 h-auto py-3 sm:h-16 sm:py-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">
              Categories
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" asChild className="text-sm">
              <Link href="/">Back to Products</Link>
            </Button>
            <Button size="sm" className="gap-1.5 sm:gap-2 text-sm" asChild>
              <Link href="/categories/new">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Category</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="p-3 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Manage Categories</h2>
          <p className="text-slate-500 text-sm">Create and manage product categories for your store.</p>
        </div>

        {categories.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 text-center">No categories yet.</p>
              <Button className="mt-4" asChild>
                <Link href="/categories/new">Create your first category</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1">
                        {editingId === category.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <CardTitle className="text-base">{category.name}</CardTitle>
                        )}
                        <p className="text-xs text-slate-500 font-mono">{category.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingId === category.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEditing(category.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors touch-manipulation"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors touch-manipulation"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(category)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors touch-manipulation"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(category.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors touch-manipulation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this category? Products in this category will need to be reassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteConfirm && handleDeleteCategory(showDeleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
