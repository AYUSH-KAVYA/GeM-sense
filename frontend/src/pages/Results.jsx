import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import PriceChartPlaceholder from '../components/PriceChartPlaceholder.jsx';
import { fetchProducts, searchProducts } from '../services/api.js';
import { Search, SlidersHorizontal, AlertCircle } from 'lucide-react';

// Local fallback keeps the dashboard usable before the API is connected.
const MOCK_PRODUCTS = [
  { id: 'GEM-001', title: 'HP LaserJet Pro Monochrome Printer', category: 'Printers', modelNumber: 'M404dn', gemPrice: 18999, competitors: { amazon: { price: 21499, url: 'https://www.amazon.in/' }, flipkart: { price: 20999, url: 'https://www.flipkart.com/' } } },
  { id: 'GEM-002', title: 'Logitech Wireless Keyboard and Mouse Combo', category: 'Computer accessories', modelNumber: 'MK270', gemPrice: 1599, competitors: { amazon: { price: 1799, url: 'https://www.amazon.in/' }, flipkart: { price: 1699, url: 'https://www.flipkart.com/' } } },
  { id: 'GEM-003', title: 'Dell 24-inch Full HD Monitor', category: 'Monitors', modelNumber: 'SE2422H', gemPrice: 8999, competitors: { amazon: { price: 8499, url: 'https://www.amazon.in/' }, flipkart: { price: 9299, url: 'https://www.flipkart.com/' } } },
];

function normalizeProducts(data) {
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => ({
    ...item,
    id: item.id ?? item._id ?? item.product_id ?? `product-${index}`,
    gemPrice: item.gemPrice ?? item.gem_price ?? item.price,
  }));
}

function getFallbackProducts(query) {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return MOCK_PRODUCTS;
  return MOCK_PRODUCTS.filter((product) => (
    [product.title, product.category, product.modelNumber]
      .some((value) => value.toLowerCase().includes(searchTerm))
  ));
}

export default function Results() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiFallback, setApiFallback] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = query.trim() ? await searchProducts(query.trim()) : await fetchProducts();
        if (!active) return;
        const normalized = normalizeProducts(response);
        setProducts(normalized.length ? normalized : getFallbackProducts(query));
        setApiFallback(!normalized.length);
      } catch {
        if (!active) return;
        setProducts(getFallbackProducts(query));
        setApiFallback(true);
        setError('Backend is unavailable. Showing sample products so you can explore the dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [query]);

  const visibleProducts = products;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"><Search size={13} /> Price intelligence</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Compare procurement prices</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">See GeM listings alongside marketplace prices to make informed purchasing decisions.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-600"><SlidersHorizontal size={15} /> Filters coming from teammate</div>
      </div>

      {error && <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
      {apiFallback && !error && <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">Sample data is being displayed until products are returned by the API.</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* FilterSidebar integration slot — teammate's component can be mounted here. */}
        <aside className="hidden lg:block" aria-label="Filter sidebar placeholder">
          <div className="sticky top-24 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><SlidersHorizontal size={16} /> Filters</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">FilterSidebar integration slot. Replace this placeholder when the component is merged.</p>
          </div>
        </aside>

        <section aria-label="Product results">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600">{loading ? 'Loading products…' : `${visibleProducts.length} products`}</p>
            <span className="text-xs text-slate-400">Sort: relevance</span>
          </div>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-[470px] animate-pulse rounded-2xl border border-slate-200 bg-white"><div className="h-48 rounded-t-2xl bg-slate-100" /><div className="space-y-3 p-5"><div className="h-4 w-3/4 rounded bg-slate-100" /><div className="h-3 w-1/2 rounded bg-slate-100" /><div className="mt-8 h-24 rounded-xl bg-slate-100" /></div></div>)}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
          {!loading && visibleProducts.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No products found. Try a different search.</div>}
          <div className="mt-7"><PriceChartPlaceholder /></div>
        </section>
      </div>
    </main>
  );
}
