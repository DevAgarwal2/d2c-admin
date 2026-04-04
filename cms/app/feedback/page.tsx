import { adminDb } from "@/lib/supabase-admin";
import FeedbackClient from "../FeedbackClient";

export const dynamic = 'force-dynamic';

async function getFeedback() {
  const { data } = await adminDb.from("feedback").select("*").order("created_at", { ascending: false });
  return data || [];
}

export default async function FeedbackPage() {
  const feedback = await getFeedback();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center gap-3 sm:gap-4">
          <a 
            href="/" 
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">StoreAdmin</h1>
          <span className="text-slate-400 hidden sm:inline">/</span>
          <span className="text-slate-600 text-sm hidden sm:inline">Feedback</span>
        </div>
      </header>

      <main className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <FeedbackClient initialFeedback={feedback || []} />
      </main>
    </div>
  );
}
