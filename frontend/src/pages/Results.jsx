import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import PriceChartPlaceholder from '../components/PriceChartPlaceholder.jsx';


import FilterSidebar from '../components/FilterSidebar.jsx';
import { fetchProducts, searchProducts } from '../services/api.js';
import { Search, ArrowLeft, AlertCircle } from 'lucide-react';

function AnalyticsBanner({ products = [] }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
      <h3 className="font-bold text-emerald-900">
        Market Intelligence
      </h3>
      <p className="text-sm text-emerald-700">
        Analyzing prices across {products.length} products.
      </p>
    </div>
  );
}

function EmptyErrorState({ type, message, onRetry, onQuickSearch }) {
  const isError = type === "error";

  return (
    <div className="empty-error-state">
      <h2>{isError ? "Something went wrong" : "No products found"}</h2>

      <p>
        {isError
          ? message || "Unable to load products. Please try again."
          : "Try adjusting your filters or searching for another product."}
      </p>

      {isError && (
        <button onClick={onRetry}>
          Retry
        </button>
      )}

      {!isError && (
        <button onClick={() => onQuickSearch("laptop")}>
          Explore Laptops
        </button>
      )}
    </div>
  );
}

const FALLBACK_PRODUCTS = [
  { id: 1, name: 'Dell Latitude 5540 Laptop (i5 13th Gen, 16GB RAM, 512GB SSD)', category: 'Laptops & Desktops', brand: 'Dell', modelNumber: '5540', gemUrl: 'https://mkp.gem.gov.in', imageUrl: null, latestPrices: [{ platform: 'GeM', price: 72500, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 78999, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 79490, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 2, name: 'HP LaserJet Pro MFP 4104dw Wireless All-in-One Printer', category: 'Printers & Scanners', brand: 'HP', modelNumber: 'MFP4104dw', gemUrl: 'https://mkp.gem.gov.in', imageUrl: null, latestPrices: [{ platform: 'GeM', price: 38500, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 44299, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 45999, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 3, name: 'Godrej Interio Ergonomic Office Chair (Ace High Back)', category: 'Office Furniture', brand: 'Godrej Interio', modelNumber: 'ACE-HB', gemUrl: 'https://mkp.gem.gov.in', imageUrl: null, latestPrices: [{ platform: 'GeM', price: 14200, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 16850, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 15999, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 4, name: 'Canon imageCLASS MF269dw II Laser Multifunction Printer', category: 'Printers & Scanners', brand: 'Canon', modelNumber: 'MF269dw-II', gemUrl: 'https://mkp.gem.gov.in', imageUrl: null, latestPrices: [{ platform: 'GeM', price: 31200, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 29499, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 30200, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 5, name: 'Daikin 1.5 Ton 5 Star Inverter Split Air Conditioner', category: 'Air Conditioners', brand: 'Daikin', modelNumber: 'MTKL50UV16', gemUrl: 'https://mkp.gem.gov.in', imageUrl: null, latestPrices: [{ platform: 'GeM', price: 42800, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 46990, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 45499, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 6, name: 'Dell OptiPlex 7010 Micro Desktop (Intel i5, 8GB, 256GB SSD)', category: 'Laptops & Desktops', brand: 'Dell', modelNumber: '7010-Micro', gemUrl: 'https://mkp.gem.gov.in', imageUrl: null, latestPrices: [{ platform: 'GeM', price: 48900, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 54200, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 53799, productUrl: 'https://flipkart.com', inStock: true }] },
];

const DEFAULT_FILTERS = { category: 'All Categories', minPrice: '', maxPrice: '', platforms: ['GeM', 'Amazon', 'Flipkart'], sortBy: 'savings_desc' };

const getPrices = (product) => {
  const records = Array.isArray(product.latestPrices) ? product.latestPrices : (product.price_records || []).map((p) => ({ platform: p.platform?.name || p.platform, price: p.price }));
  const gem = records.find((p) => String(p.platform).toLowerCase() === 'gem')?.price ?? product.gem_price;
  const competitors = records.filter((p) => String(p.platform).toLowerCase() !== 'gem');
  return { gem: Number(gem) || 0, competitors, all: records };
};

export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => setSearchInput(query), [query]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = query.trim() ? await searchProducts(query.trim()) : await fetchProducts();
      if (Array.isArray(response?.data) && response.data.length > 0) {
        setProducts(response.data);
        setUsingMock(false);
      } else {
        const fallback = query.trim()
          ? FALLBACK_PRODUCTS.filter((p) => `${p.name} ${p.category} ${p.brand || ''}`.toLowerCase().includes(query.toLowerCase()))
          : FALLBACK_PRODUCTS;
        setProducts(fallback);
        setUsingMock(true);
      }
    } catch (err) {
      const fallback = query.trim()
        ? FALLBACK_PRODUCTS.filter((p) => `${p.name} ${p.category} ${p.brand || ''}`.toLowerCase().includes(query.toLowerCase()))
        : FALLBACK_PRODUCTS;
      setProducts(fallback);
      setUsingMock(true);
      // Cached products are still useful; only surface an error if nothing can be shown.
      if (fallback.length === 0) setError(err?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = searchInput.trim();
    setSearchParams(next ? { q: next } : {});
  };

  const filteredProducts = products
    .filter((product) => {
      const categoryOk = filters.category === 'All Categories' || product.category === filters.category;
      const { gem, competitors, all } = getPrices(product);
      const prices = all.map((p) => Number(p.price)).filter(Number.isFinite);
      const min = filters.minPrice === '' ? null : Number(filters.minPrice);
      const max = filters.maxPrice === '' ? null : Number(filters.maxPrice);
      const rangeOk = prices.some((price) => (min === null || price >= min) && (max === null || price <= max));
      const platformOk = (filters.platforms || []).some((platform) => all.some((p) => String(p.platform).toLowerCase() === platform.toLowerCase()));
      return categoryOk && (prices.length ? rangeOk : min === null && max === null) && platformOk;
    })
    .sort((a, b) => {
      const pa = getPrices(a); const pb = getPrices(b);
      const minA = Math.min(...pa.all.map((p) => Number(p.price)).filter(Number.isFinite), Infinity);
      const minB = Math.min(...pb.all.map((p) => Number(p.price)).filter(Number.isFinite), Infinity);
      const savingsA = pa.competitors.length ? Math.max(...pa.competitors.map((p) => pa.gem && Number(p.price) ? ((Number(p.price) - pa.gem) / Number(p.price)) * 100 : 0)) : 0;
      const savingsB = pb.competitors.length ? Math.max(...pb.competitors.map((p) => pb.gem && Number(p.price) ? ((Number(p.price) - pb.gem) / Number(p.price)) * 100 : 0)) : 0;
      if (filters.sortBy === 'price_asc') return minA - minB;
      if (filters.sortBy === 'price_desc') return minB - minA;
      if (filters.sortBy === 'rating_desc') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (filters.sortBy === 'newest') return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0);
      return savingsB - savingsA;
    });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gem-700 transition-colors mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Cross-Platform Price Comparison</h1>
            <p className="text-xs text-slate-500 mt-1">Comparing GeM portal rate contracts with Amazon India and Flipkart pricing</p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search product, model, or GeM URL..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gem-600 focus:border-gem-600 bg-slate-50 focus:bg-white" />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-gem-700 hover:bg-gem-800 text-white text-xs font-bold rounded-xl transition-colors">Search</button>
          </form>
        </div>
        {usingMock && <div className="mt-4 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs"><AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" /> Backend unavailable — showing cached reference benchmarks.</div>}
      </div>

      {!loading && filteredProducts.length > 0 && <AnalyticsBanner products={filteredProducts} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1">
          <FilterSidebar filters={filters} onFilterChange={setFilters} />
        </div>
        <div className="lg:col-span-3 space-y-6 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1, 2, 3, 4].map((n) => <div key={n} className="h-72 rounded-2xl bg-slate-200 animate-pulse" />)}</div>
          ) : error || filteredProducts.length === 0 ? (
            <EmptyErrorState type={error ? 'error' : 'empty'} message={error} onRetry={loadProducts} onQuickSearch={(q) => { setSearchInput(q); setSearchParams({ q }); }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
          {!loading && filteredProducts.length > 0 && <PriceChartPlaceholder productName={query ? `Query: ${query}` : 'All Tracked Categories'} />}
        </div>
      </div>
    </div>
  );
}
