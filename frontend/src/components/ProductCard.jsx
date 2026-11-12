import { ArrowUpRight, BadgeCheck, ExternalLink, Package, TrendingDown } from 'lucide-react';

const formatPrice = (value) => {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const getPrice = (...values) => {
  const value = values.find((candidate) => (
    candidate != null && candidate !== '' && Number.isFinite(Number(candidate))
  ));
  return value == null ? null : Number(value);
};

const getPlatformName = (platform) => (
  typeof platform === 'string' ? platform : platform?.name
);

function getCompetitors(product) {
  if (Array.isArray(product.latestPrices)) {
    const records = product.latestPrices
      .filter((record) => getPlatformName(record.platform)?.toLowerCase() !== 'gem')
      .map((record, index) => ({
        name: getPlatformName(record.platform) || `Competitor ${index + 1}`,
        price: getPrice(record.price),
        url: record.productUrl ?? record.url,
      }));
    if (records.length) return records;
  }

  if (Array.isArray(product.price_records)) {
    const records = product.price_records
      .filter((record) => getPlatformName(record.platform)?.toLowerCase() !== 'gem')
      .map((record, index) => ({
        name: getPlatformName(record.platform) || `Competitor ${index + 1}`,
        price: getPrice(record.price),
        url: record.productUrl ?? record.url,
      }));
    if (records.length) return records;
  }

  if (product.competitor_price != null) {
    return [{
      name: product.competitor_name || 'Amazon',
      price: getPrice(product.competitor_price),
      url: product.competitor_url,
    }];
  }

  const competitors = product.competitors ?? {};
  const entries = Object.entries(competitors).map(([name, competitor]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    price: getPrice(competitor?.price),
    url: competitor?.url,
  }));
  const directPrices = [
    { name: 'Amazon', price: product.amazonPrice ?? product.amazon_price, url: product.amazonUrl },
    { name: 'Flipkart', price: product.flipkartPrice ?? product.flipkart_price, url: product.flipkartUrl },
  ];

  for (const direct of directPrices) {
    if (direct.price != null && !entries.some((entry) => entry.name === direct.name)) {
      entries.push({ ...direct, price: getPrice(direct.price) });
    }
  }

  return entries.filter((entry) => entry.price != null || entry.url);
}

export default function ProductCard({ product, onSelectProduct }) {
  if (!product) return null;

  const title = product.title ?? product.name ?? 'Untitled product';
  const image = product.imageUrl ?? product.image;
  const gemRecord = Array.isArray(product.latestPrices)
    ? product.latestPrices.find((record) => getPlatformName(record.platform)?.toLowerCase() === 'gem')
    : null;
  const gemPrice = getPrice(product.gemPrice, product.gem_price, product.price, gemRecord?.price);
  const gemUrl = product.gemUrl ?? product.gem_url ?? gemRecord?.productUrl;
  const competitors = getCompetitors(product);
  const markets = [
    { name: 'GeM', price: gemPrice, url: gemUrl },
    ...competitors,
  ];
  const lowest = markets.reduce(
    (best, market) => market.price != null && (!best || market.price < best.price) ? market : best,
    null,
  );
  const lowestIsGem = lowest?.name === 'GeM';
  const savings = gemPrice != null && lowest && lowest.name !== 'GeM'
    ? gemPrice - lowest.price
    : 0;
  const savingsPercent = gemPrice > 0 ? (savings / gemPrice) * 100 : 0;
  const model = product.modelNumber ?? product.model_number;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/70 p-5">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-contain mix-blend-multiply" loading="lazy" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-300">
            <Package size={38} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
          {product.category || 'General Equipment'}
        </span>
        {product.id != null && (
          <span className="absolute right-3 top-3 text-[10px] font-medium text-slate-400">ID: {product.id}</span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="line-clamp-2 min-h-12 text-[15px] font-bold leading-6 text-ink">{title}</h3>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {product.brand && <span>Brand: <span className="font-medium text-slate-700">{product.brand}</span></span>}
          {model && <span>Model: <span className="font-medium text-slate-700">{model}</span></span>}
        </div>

        <div className={`mt-4 rounded-xl border p-3.5 ${lowestIsGem ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${lowestIsGem ? 'text-emerald-800' : 'text-slate-600'}`}>
            <BadgeCheck size={14} /> Lowest listed price · {lowest?.name ?? 'Unavailable'}
          </div>
          <div className={`mt-1 text-2xl font-extrabold tracking-tight ${lowestIsGem ? 'text-emerald-950' : 'text-slate-900'}`}>
            {formatPrice(lowest?.price)}
          </div>
          {savings > 0 && (
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Save {formatPrice(savings)} ({savingsPercent.toFixed(1)}%) vs GeM
            </p>
          )}
          {lowestIsGem && <p className="mt-1 text-xs text-emerald-700">GeM is the lowest among available listings.</p>}
          {gemUrl && (
            <a href={gemUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
              GeM Portal <ExternalLink size={13} />
            </a>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {competitors.length ? competitors.map((competitor, index) => (
            <div key={`${competitor.name}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-slate-700">{competitor.name}</p>
                <p className="text-sm font-bold text-ink">{formatPrice(competitor.price)}</p>
              </div>
              {competitor.url && (
                <a href={competitor.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${competitor.name} listing`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy">
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          )) : (
            <p className="rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-400">No external competitor price logged yet.</p>
          )}
        </div>

        {onSelectProduct && (
          <button type="button" onClick={() => onSelectProduct(product)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <TrendingDown size={16} /> Compare Breakdown &amp; Bulk Savings <ArrowUpRight size={15} />
          </button>
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500 sm:px-5">
        <span className="inline-flex items-center gap-1 font-medium text-emerald-600"><BadgeCheck size={14} /> Price verified</span>
        <span>Includes GST &amp; standard delivery</span>
      </footer>
    </article>
  );
}
