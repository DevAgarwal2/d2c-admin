import { saveCategory } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Save, Folder, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default function NewCategoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  async function handleSubmit(formData: FormData) {
    "use server";
    
    const result = await saveCategory(formData);
    
    if (result && (result as any).error === "missing_name") {
      redirect("/categories/new?error=missing_name");
    }
    
    if (result && (result as any).error === "duplicate_id") {
      redirect("/categories/new?error=duplicate_id");
    }
    
    redirect("/categories");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="px-3 sm:px-6 lg:px-8 h-auto py-3 sm:h-16 sm:py-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/categories" className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">
              New Category
            </h1>
          </div>
        </div>
      </header>

      <main className="p-3 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Folder className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle>Create Category</CardTitle>
                  <CardDescription>Add a new category for your products.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form action={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="e.g. Brass Products" 
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea 
                    id="description" 
                    name="description"
                    placeholder="Describe this category..."
                    className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button variant="outline" type="button" className="w-full sm:w-auto" asChild>
                    <Link href="/categories">Cancel</Link>
                  </Button>
                  <Button type="submit" className="gap-2 w-full sm:w-auto">
                    <Save className="h-4 w-4" />
                    Create Category
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
