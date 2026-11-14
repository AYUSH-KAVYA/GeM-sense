import { ExternalLink, TrendingDown, TrendingUp, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';
function VerdictBadge({ gemPrice, competitorPrices = [], verdict }) {
  const competitors = competitorPrices
    .map((p) => Number(p.price))
    .filter((p) => Number.isFinite(p) && p > 0);

  const cheapestCompetitor = competitors.length
    ? Math.min(...competitors)
    : null;

  const isCheaper =
    gemPrice > 0 &&
    cheapestCompetitor !== null &&
    gemPrice < cheapestCompetitor;

  const label =
    verdict ||
    (isCheaper ? "Best Price" : "Price Comparison");

  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
        isCheaper
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-slate-100 text-slate-600 border border-slate-200"
      }`}
    >
      {label}
    </span>
  );
}

export default function ProductCard({ product }) {
  if (!product) return null;
  const formatINR = (val) => val === null || val === undefined || Number.isNaN(Number(val)) ? 'N/A' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(val));

  let gemPrice = null;
  let gemUrl = product.gemUrl || product.gem_url || '#';
  if (Array.isArray(product.latestPrices)) {
    const record = product.latestPrices.find((p) => p.platform?.toLowerCase() === 'gem');
    if (record) { gemPrice = record.price; gemUrl = record.productUrl || gemUrl; }
  } else if (product.gem_price !== undefined) gemPrice = product.gem_price;

  let competitors = [];
  if (Array.isArray(product.latestPrices)) competitors = product.latestPrices.filter((p) => p.platform?.toLowerCase() !== 'gem');
  else if (Array.isArray(product.price_records)) competitors = product.price_records.filter((p) => p.platform?.name?.toLowerCase() !== 'gem').map((p) => ({ platform: p.platform?.name || 'Competitor', price: p.price, productUrl: p.url || p.productUrl, inStock: p.inStock ?? true }));
  else if (product.competitor_price !== undefined) competitors = [{ platform: product.competitor_name || 'Amazon', price: product.competitor_price, productUrl: '#', inStock: true }];

  const competitorPrices = competitors.map((item) => Number(item.price)).filter(Number.isFinite);
  const confidenceRaw = Number(product.matchConfidence ?? product.match_confidence);
  const confidence = Number.isFinite(confidenceRaw) ? Math.round(confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw) : null;
  const safeLink = (url) => Boolean(url && url !== '#' && /^https?:\/\//i.test(url));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"><Tag className="w-3 h-3 text-slate-500" />{product.category || 'General Equipment'}</span>
          <div className="flex flex-wrap items-center gap-2">
            {confidence !== null && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">{confidence}% Spec Match</span>}
            <VerdictBadge gemPrice={gemPrice} competitorPrices={competitorPrices} verdict={product.verdict} />
          </div>
        </div>
        {product.modelNumber && <div className="text-[11px] font-mono font-medium text-slate-400 mb-2">Model: {product.modelNumber}</div>}
        <div className="flex gap-4 items-start mb-4">
          <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 flex-shrink-0">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" /> : <div className="text-slate-400 text-[10px] font-semibold text-center uppercase tracking-wider">{product.brand || 'Product'}</div>}
          </div>
          <div className="min-w-0"><h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-gem-700 transition-colors" title={product.name}>{product.name}</h3>{product.brand && <p className="text-xs text-slate-500 mt-1 font-medium">Brand: {product.brand}</p>}</div>
        </div>
        <div className="bg-gradient-to-br from-gem-50 to-sky-50/60 border border-gem-200 rounded-xl p-3.5 mb-4">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-gem-700" /><span className="text-xs font-bold text-gem-800 uppercase tracking-wide">GeM Official Price</span></div>{safeLink(gemUrl) && <a href={gemUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-gem-700 hover:text-gem-900 flex items-center gap-1 hover:underline"><span>GeM Portal</span><ExternalLink className="w-3 h-3" /></a>}</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2"><span className="text-xl sm:text-2xl font-black text-gem-900">{formatINR(gemPrice)}</span><span className="text-[11px] text-gem-600 font-medium">(Govt. benchmark)</span></div>
        </div>
        <div><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Commercial Competitor Benchmarks</span><div className="space-y-2">
          {competitors.length ? competitors.map((comp, idx) => {
            const diff = Number(comp.price || 0) - Number(gemPrice || 0); const cheaperOnGem = diff > 0; const percent = comp.price ? Math.abs(Math.round((diff / Number(comp.price)) * 100)) : 0;
            return <div key={`${comp.platform}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-3 py-2 transition-colors text-xs"><div className="flex items-center gap-2"><span className="font-semibold text-slate-800">{comp.platform}</span>{safeLink(comp.productUrl) && <a href={comp.productUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${comp.platform}`} className="text-slate-400 hover:text-slate-600"><ExternalLink className="w-3 h-3" /></a>}</div><div className="flex items-center gap-2.5"><span className="font-bold text-slate-800">{formatINR(comp.price)}</span>{gemPrice && comp.price && <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold text-[10px] ${cheaperOnGem ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{cheaperOnGem ? <><TrendingDown className="w-3 h-3" />{percent}% cheaper on GeM</> : <><TrendingUp className="w-3 h-3" />{percent}% cheaper on {comp.platform}</>}</span>}</div></div>;
          }) : <p className="text-xs text-slate-400 italic py-1">No external competitor price logged yet.</p>}
        </div></div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"><span className="flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Price verified</span><span>Includes GST & standard delivery</span></div>
    </div>
  );
}
