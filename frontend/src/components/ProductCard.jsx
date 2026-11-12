import { ArrowUpRight, BadgeCheck, ExternalLink, Package } from 'lucide-react';

const formatPrice = (value) => {
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
};

function getDeal(price, gemPrice) {
  if (!price || !gemPrice || Number(price) === Number(gemPrice)) return null;
  const pct = Math.round((Math.abs(Number(price) - Number(gemPrice)) / Number(price)) * 100);
  return Number(gemPrice) < Number(price)
    ? { text: `${pct}% cheaper on GeM`, tone: 'green' }
    : { text: `${Math.round((Math.abs(Number(price) - Number(gemPrice)) / Number(gemPrice)) * 100)}% cheaper on marketplace`, tone: 'amber' };
}

export default function ProductCard({ product }) {
  const {
    id, title = 'Untitled product', category = 'General', modelNumber, model_number,
    image, imageUrl, gemPrice, gem_price, competitors = {},
  } = product;

  const officialPrice = gemPrice ?? gem_price;
  const model = modelNumber ?? model_number ?? 'Not specified';
  const imageSrc = imageUrl ?? image;
  const marketplaces = [
    { name: 'Amazon', price: competitors.amazon?.price ?? product.amazonPrice ?? product.amazon_price, url: competitors.amazon?.url ?? product.amazonUrl ?? 'https://www.amazon.in/' },
    { name: 'Flipkart', price: competitors.flipkart?.price ?? product.flipkartPrice ?? product.flipkart_price, url: competitors.flipkart?.url ?? product.flipkartUrl ?? 'https://www.flipkart.com/' },
  ];

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/70 p-5">
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="h-full w-full object-contain mix-blend-multiply" loading="lazy" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-300"><Package size={38} /></div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">{category}</span>
        {id != null && <span className="absolute right-3 top-3 text-[10px] font-medium text-slate-400">ID: {id}</span>}
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="line-clamp-2 min-h-12 text-[15px] font-bold leading-6 text-ink">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">Model no. <span className="font-medium text-slate-700">{model}</span></p>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800"><BadgeCheck size={14} /> GeM Official Price</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-950">{formatPrice(officialPrice)}</div>
          <div className="mt-1 text-[11px] text-emerald-700/80">Listed on Government e-Marketplace</div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Marketplace comparison</p>
          <div className="space-y-2">
            {marketplaces.map((market) => {
              const deal = getDeal(market.price, officialPrice);
              const isGeMCheaper = deal?.tone === 'green';
              return (
                <div key={market.name} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{market.name}</p>
                    <p className="mt-0.5 text-sm font-bold text-ink">{formatPrice(market.price)}</p>
                    {deal && <p className={`mt-1 text-[10px] font-semibold ${isGeMCheaper ? 'text-emerald-700' : 'text-amber-700'}`}>{deal.text}</p>}
                  </div>
                  <a href={market.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${market.name} listing`} className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy"><ExternalLink size={15} /></a>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
          <span>Price snapshot · Phase 1</span><ArrowUpRight size={14} />
        </div>
    </div>
    </article>
  );
}
