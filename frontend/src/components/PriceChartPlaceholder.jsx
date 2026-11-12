import { Activity, CalendarClock } from 'lucide-react';

export default function PriceChartPlaceholder({ title = 'Historical price trend' }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ink">{title}</p>
          <p className="mt-1 text-xs text-slate-500">Price history and trend analysis will appear here in Phase 2.</p>
        </div>
        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Activity size={18} /></span>
      </div>
      <div className="mt-5 flex h-36 items-end gap-2 rounded-xl bg-slate-50 px-4 pb-4 pt-5">
        {[32, 48, 40, 64, 52, 78, 61, 88, 70, 96, 82, 100].map((height, index) => (
          <div key={index} className="flex-1 rounded-t-md bg-blue-200/70" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarClock size={13} /> Illustrative visual only · No historical data yet</div>
    </section>
  );
}
