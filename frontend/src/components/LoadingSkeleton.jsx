import { Activity, Search } from 'lucide-react';

export default function LoadingSkeleton() {
  return (
    <section aria-live="polite" aria-busy="true">
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Activity className="animate-pulse shrink-0" size={18} />
        <span className="font-medium">Scanning GeM, Amazon &amp; Flipkart for real-time procurement prices...</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <article key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-48 animate-pulse bg-slate-100" />
            <div className="space-y-4 p-5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="h-24 animate-pulse rounded-xl bg-emerald-50" />
              <div className="space-y-2">
                <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              </div>
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
