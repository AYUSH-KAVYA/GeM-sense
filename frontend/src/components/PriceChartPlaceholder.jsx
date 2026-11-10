import { LineChart, Clock, ArrowUpRight } from 'lucide-react';

export default function PriceChartPlaceholder({ productName = 'Product' }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-gem-50 text-gem-700 flex items-center justify-center mb-3">
        <LineChart className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">
        Historical Price Trends ({productName})
      </h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1">
        Interactive 30-day cross-platform price fluctuation graphs (GeM vs Amazon vs Flipkart) will render here in Phase 2.
      </p>
      <div className="mt-4 flex items-center gap-3 text-[11px] font-medium text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Logged daily
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <ArrowUpRight className="w-3.5 h-3.5" /> Recharts / Chart.js ready
        </span>
      </div>
    </div>
  );
}
