import { useMemo, useState, useEffect } from 'react';
import { X, ExternalLink, Package, ShieldCheck, Star, RefreshCw } from 'lucide-react';
import PriceChartPlaceholder from './PriceChartPlaceholder.jsx';
import { refreshProductPrice } from '../services/api.js';

const money = (value) => value == null || value === '' || !Number.isFinite(Number(value))
  ? '—'
  : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value));

const getPlatforms = (product) => {
  const gem = product?.gemPrice ?? product?.gem_price ?? product?.price;
  const competitors = product?.competitors ?? {};
  return [
    { key: 'gem', name: 'GeM', price: gem, url: product?.gemUrl ?? product?.gem_url, stock: product?.gemStock ?? product?.gem_stock ?? 'Check listing', rating: product?.gemRating ?? product?.gem_rating },
    { key: 'amazon', name: 'Amazon', price: competitors.amazon?.price ?? product?.amazonPrice ?? product?.amazon_price, url: competitors.amazon?.url ?? product?.amazonUrl ?? 'https://www.amazon.in/', stock: competitors.amazon?.stock ?? product?.amazonStock ?? 'Check listing', rating: competitors.amazon?.rating ?? product?.amazonRating },
    { key: 'flipkart', name: 'Flipkart', price: competitors.flipkart?.price ?? product?.flipkartPrice ?? product?.flipkart_price, url: competitors.flipkart?.url ?? product?.flipkartUrl ?? 'https://www.flipkart.com/', stock: competitors.flipkart?.stock ?? product?.flipkartStock ?? 'Check listing', rating: competitors.flipkart?.rating ?? product?.flipkartRating },
  ];
};

function Stars({ rating }) {
  const value = Number(rating);
  return (
    <span className="inline-flex items-center gap-1 text-amber-500" aria-label={Number.isFinite(value) ? `${value} out of 5 stars` : 'Rating unavailable'}>
      {Number.isFinite(value) ? <><Star size={13} fill="currentColor" /> <span className="text-xs font-semibold text-slate-700">{value.toFixed(1)}/5</span></> : <span className="text-xs text-slate-400">Not rated</span>}
    </span>
  );
}

export default function ProductModal({ product, isOpen, onClose, onPriceRefresh }) {
  const [quantity, setQuantity] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [historyKey, setHistoryKey] = useState(0);
  useEffect(() => { if (isOpen) { setQuantity(10); setRefreshError(''); } }, [isOpen, product]);
  const platforms = useMemo(() => getPlatforms(product ?? {}), [product]);
  const gemPrice = Number(platforms[0].price);
  const lowest = platforms.reduce((best, item) => Number.isFinite(Number(item.price)) && (!best || Number(item.price) < Number(best.price)) ? item : best, null);
  const perUnitSavings = Math.max(0, ...platforms.map((p) => Number(p.price)).filter(Number.isFinite)) - gemPrice;
  const validGem = Number.isFinite(gemPrice);

  if (!isOpen || !product) return null;
  const title = product.title ?? product.name ?? 'Product details';

  const handleRefresh = async () => {
    if (product.id == null && product._id == null) {
      setRefreshError('Product ID is unavailable; cannot refresh.');
      return;
    }
    setRefreshing(true);
    setRefreshError('');
    try {
      const result = await refreshProductPrice(product.id ?? product._id);
      onPriceRefresh?.(result, product);
      setHistoryKey((key) => key + 1);
    } catch (error) {
      setRefreshError(error?.response?.data?.message || 'Price refresh failed. Check backend connection.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Procurement comparison</p><h2 id="product-modal-title" className="mt-1 text-xl font-bold text-slate-900">{title}</h2></div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm">
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing…' : 'Force Live Price Refresh'}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close comparison"><X size={20} /></button>
          </div>
        </header>
        <div className="p-5 sm:p-7">
          {refreshError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{refreshError}</p>}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="grid h-32 w-full place-items-center rounded-xl bg-slate-50 sm:w-40">
              {(product.imageUrl ?? product.image) ? <img src={product.imageUrl ?? product.image} alt={title} className="h-full w-full object-contain p-3" /> : <Package size={40} className="text-slate-300" />}
            </div>
            <div className="flex-1"><h3 className="text-lg font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm text-slate-500">Brand: <span className="font-medium text-slate-700">{product.brand ?? 'Not specified'}</span></p><p className="mt-1 text-sm text-slate-500">Model: <span className="font-medium text-slate-700">{product.modelNumber ?? product.model_number ?? 'Not specified'}</span></p><p className="mt-1 text-sm text-slate-500">Category: <span className="font-medium text-slate-700">{product.category ?? 'General'}</span></p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {platforms.map((platform) => {
              const price = Number(platform.price);
              const valid = Number.isFinite(price);
              const diff = valid && validGem && platform.key !== 'gem' ? price - gemPrice : 0;
              const pct = valid && validGem && gemPrice !== 0 && platform.key !== 'gem' ? (diff / gemPrice) * 100 : 0;
              const isLowest = lowest?.key === platform.key;
              return <article key={platform.key} className={`rounded-xl border p-4 ${isLowest ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between"><h4 className="font-bold text-slate-900">{platform.name}</h4>{isLowest && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">LOWEST</span>}</div>
                <p className={`mt-3 text-2xl font-extrabold ${isLowest ? 'text-emerald-800' : 'text-slate-900'}`}>{money(platform.price)}</p>
                {platform.key !== 'gem' && valid && validGem && <p className={`mt-1 text-xs font-semibold ${diff < 0 ? 'text-emerald-700' : diff > 0 ? 'text-amber-700' : 'text-slate-500'}`}>{diff < 0 ? `${money(Math.abs(diff))} (${Math.abs(pct).toFixed(1)}%) below GeM` : diff > 0 ? `${money(diff)} (+${pct.toFixed(1)}%) vs GeM` : 'Same as GeM'}</p>}
                <div className="mt-4 space-y-2 text-sm"><p className="text-slate-500">Stock: <span className="font-medium text-slate-700">{platform.stock}</span></p><p className="text-slate-500">Seller rating: <Stars rating={platform.rating} /></p></div>
                <a href={platform.url || '#'} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">View on Platform <ExternalLink size={14} /></a>
              </article>;
            })}
          </div>
          <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
            <div className="flex items-center gap-2 font-bold text-blue-950"><ShieldCheck size={18} /> Procurement Officer Summary</div>
            <p className="mt-2 text-sm text-blue-900">{validGem && Number.isFinite(Number(lowest?.price)) && Number(lowest.price) < gemPrice ? `The lowest listed price is ${money(lowest.price)} on ${lowest.name}, saving ${money(gemPrice - Number(lowest.price))} per unit versus GeM.` : 'GeM is currently the lowest priced valid listing, or comparable prices are unavailable.'}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="text-sm font-medium text-blue-950">Bulk quantity <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="ml-2 rounded-lg border border-blue-200 bg-white px-3 py-2"><option value={10}>10 units</option><option value={50}>50 units</option><option value={100}>100 units</option></select></label>
              <div className="text-sm text-blue-900">Estimated savings vs. highest marketplace: <strong className="block text-xl">{money(Math.max(0, perUnitSavings) * quantity)}</strong><span className="text-xs">({money(Math.max(0, perUnitSavings))} × {quantity} units)</span></div>
            </div>
          </section>
          <div className="mt-6"><PriceChartPlaceholder key={historyKey} productId={product.id ?? product._id} product={product} /></div>
        </div>
      </section>
    </div>
  );
}
