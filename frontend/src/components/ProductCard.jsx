import { ExternalLink, TrendingDown, TrendingUp, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ProductCard({ product }) {
  if (!product) return null;

  // Format currency in Indian Rupees
  const formatINR = (val) => {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Extract GeM price and URL
  let gemPrice = null;
  let gemUrl = product.gemUrl || product.gem_url || '#';

  if (Array.isArray(product.latestPrices)) {
    const gemRecord = product.latestPrices.find(
      (p) => p.platform?.toLowerCase() === 'gem'
    );
    if (gemRecord) {
      gemPrice = gemRecord.price;
      gemUrl = gemRecord.productUrl || gemUrl;
    }
  } else if (product.gem_price !== undefined) {
    gemPrice = product.gem_price;
  }

  // Extract competitor prices
  let competitors = [];
  if (Array.isArray(product.latestPrices)) {
    competitors = product.latestPrices.filter(
      (p) => p.platform?.toLowerCase() !== 'gem'
    );
  } else if (Array.isArray(product.price_records)) {
    competitors = product.price_records
      .filter((p) => p.platform?.name?.toLowerCase() !== 'gem')
      .map((p) => ({
        platform: p.platform?.name || 'Competitor',
        price: p.price,
        productUrl: p.url || p.productUrl,
        inStock: p.inStock ?? true,
      }));
  } else if (product.competitor_price !== undefined) {
    competitors = [
      {
        platform: product.competitor_name || 'Amazon',
        price: product.competitor_price,
        productUrl: '#',
        inStock: true,
      },
    ];
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between">
      <div>
        {/* Header Badges & Category */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <Tag className="w-3 h-3 text-slate-500" />
            {product.category || 'General Equipment'}
          </span>
          {product.modelNumber && (
            <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Model: {product.modelNumber}
            </span>
          )}
        </div>

        {/* Product Image & Title */}
        <div className="flex gap-4 items-start mb-4">
          <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 flex-shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-400 text-[10px] font-semibold text-center uppercase tracking-wider">
                {product.brand || 'Product'}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-gem-700 transition-colors" title={product.name}>
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-xs text-slate-500 mt-1 font-medium">Brand: {product.brand}</p>
            )}
          </div>
        </div>

        {/* Highlighted "GeM Official Price" Box */}
        <div className="bg-gradient-to-br from-gem-50 to-sky-50/60 border border-gem-200 rounded-xl p-3.5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-gem-700" />
              <span className="text-xs font-bold text-gem-800 uppercase tracking-wide">
                GeM Official Price
              </span>
            </div>
            {gemUrl && gemUrl !== '#' && (
              <a
                href={gemUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-gem-700 hover:text-gem-900 flex items-center gap-1 hover:underline"
              >
                <span>GeM Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gem-900">
              {formatINR(gemPrice)}
            </span>
            <span className="text-[11px] text-gem-600 font-medium">
              (Govt. benchmark)
            </span>
          </div>
        </div>

        {/* Competitor Price List */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Commercial Competitor Benchmarks
          </span>

          <div className="space-y-2">
            {competitors.length > 0 ? (
              competitors.map((comp, idx) => {
                const diff = (comp.price || 0) - (gemPrice || 0);
                const isGeMCheaper = diff > 0;
                const percent = comp.price
                  ? Math.abs(Math.round((diff / comp.price) * 100))
                  : 0;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-3 py-2 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {comp.platform}
                      </span>
                      {comp.productUrl && comp.productUrl !== '#' && (
                        <a
                          href={comp.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-800">
                        {formatINR(comp.price)}
                      </span>

                      {gemPrice && comp.price ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            isGeMCheaper
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isGeMCheaper ? (
                            <>
                              <TrendingDown className="w-3 h-3" />
                              {percent}% cheaper on GeM
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-3 h-3" />
                              {percent}% cheaper on {comp.platform}
                            </>
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic py-1">
                No external competitor price logged yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Status */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Price verified
        </span>
        <span>Includes GST & standard delivery</span>
      </div>
    </div>
  );
}
