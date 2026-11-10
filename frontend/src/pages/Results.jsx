import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import PriceChartPlaceholder from '../components/PriceChartPlaceholder.jsx';
import { fetchProducts, searchProducts } from '../services/api.js';
import { Search, SlidersHorizontal, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

// Fallback mock dataset so the UI renders fully even before backend is started
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: 'Dell Latitude 5540 Laptop (i5 13th Gen, 16GB RAM, 512GB SSD)',
    category: 'Laptops & Desktops',
    brand: 'Dell',
    modelNumber: '5540',
    gemUrl: 'https://mkp.gem.gov.in',
    imageUrl: null,
    latestPrices: [
      { platform: 'GeM', price: 72500, productUrl: 'https://mkp.gem.gov.in', inStock: true },
      { platform: 'Amazon', price: 78999, productUrl: 'https://amazon.in', inStock: true },
      { platform: 'Flipkart', price: 79490, productUrl: 'https://flipkart.com', inStock: true },
    ],
  },
  {
    id: 2,
    name: 'HP LaserJet Pro MFP 4104dw Wireless All-in-One Printer',
    category: 'Printers & Scanners',
    brand: 'HP',
    modelNumber: 'MFP4104dw',
    gemUrl: 'https://mkp.gem.gov.in',
    imageUrl: null,
    latestPrices: [
      { platform: 'GeM', price: 38500, productUrl: 'https://mkp.gem.gov.in', inStock: true },
      { platform: 'Amazon', price: 44299, productUrl: 'https://amazon.in', inStock: true },
      { platform: 'Flipkart', price: 45999, productUrl: 'https://flipkart.com', inStock: true },
    ],
  },
  {
    id: 3,
    name: 'Godrej Interio Ergonomic Office Chair (Ace High Back)',
    category: 'Office Furniture',
    brand: 'Godrej Interio',
    modelNumber: 'ACE-HB',
    gemUrl: 'https://mkp.gem.gov.in',
    imageUrl: null,
    latestPrices: [
      { platform: 'GeM', price: 14200, productUrl: 'https://mkp.gem.gov.in', inStock: true },
      { platform: 'Amazon', price: 16850, productUrl: 'https://amazon.in', inStock: true },
      { platform: 'Flipkart', price: 15999, productUrl: 'https://flipkart.com', inStock: true },
    ],
  },
  {
    id: 4,
    name: 'Canon imageCLASS MF269dw II Laser Multifunction Printer',
    category: 'Printers & Scanners',
    brand: 'Canon',
    modelNumber: 'MF269dw-II',
    gemUrl: 'https://mkp.gem.gov.in',
    imageUrl: null,
    latestPrices: [
      { platform: 'GeM', price: 31200, productUrl: 'https://mkp.gem.gov.in', inStock: true },
      { platform: 'Amazon', price: 29499, productUrl: 'https://amazon.in', inStock: true },
      { platform: 'Flipkart', price: 30200, productUrl: 'https://flipkart.com', inStock: true },
    ],
  },
  {
    id: 5,
    name: 'Daikin 1.5 Ton 5 Star Inverter Split Air Conditioner',
    category: 'Air Conditioners',
    brand: 'Daikin',
    modelNumber: 'MTKL50UV16',
    gemUrl: 'https://mkp.gem.gov.in',
    imageUrl: null,
    latestPrices: [
      { platform: 'GeM', price: 42800, productUrl: 'https://mkp.gem.gov.in', inStock: true },
      { platform: 'Amazon', price: 46990, productUrl: 'https://amazon.in', inStock: true },
      { platform: 'Flipkart', price: 45499, productUrl: 'https://flipkart.com', inStock: true },
    ],
  },
  {
    id: 6,
    name: 'Dell OptiPlex 7010 Micro Desktop (Intel i5, 8GB, 256GB SSD)',
    category: 'Laptops & Desktops',
    brand: 'Dell',
    modelNumber: '7010-Micro',
    gemUrl: 'https://mkp.gem.gov.in',
    imageUrl: null,
    latestPrices: [
      { platform: 'GeM', price: 48900, productUrl: 'https://mkp.gem.gov.in', inStock: true },
      { platform: 'Amazon', price: 54200, productUrl: 'https://amazon.in', inStock: true },
      { platform: 'Flipkart', price: 53799, productUrl: 'https://flipkart.com', inStock: true },
    ],
  },
];

export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    const apiCall = query.trim() ? searchProducts(query.trim()) : fetchProducts();

    apiCall
      .then((res) => {
        if (!isCurrent) return;
        if (res?.data && res.data.length > 0) {
          setProducts(res.data);
          setUsingMock(false);
        } else {
          // If query returns empty from API, filter fallback
          const filtered = FALLBACK_PRODUCTS.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
          );
          setProducts(filtered);
          setUsingMock(true);
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        // Backend offline: use mock data
        const filtered = query.trim()
          ? FALLBACK_PRODUCTS.filter((p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.category.toLowerCase().includes(query.toLowerCase())
            )
          : FALLBACK_PRODUCTS;
        setProducts(filtered);
        setUsingMock(true);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchInput.trim() ? { q: searchInput.trim() } : {});
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gem-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Overview
            </Link>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Cross-Platform Price Comparison
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing GeM portal rate contracts with Amazon India and Flipkart live pricing
            </p>
          </div>

          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search product, model, or GeM URL..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gem-600 focus:border-gem-600 bg-slate-50 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-gem-700 hover:bg-gem-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {usingMock && (
          <div className="mt-4 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Backend API offline or connecting — displaying cached Phase 1 reference benchmarks.
            </span>
          </div>
        )}
      </div>

      {/* Main Layout: Left-column FilterSidebar slot + Right-column Results grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Designated Left-Column Slot for FilterSidebar (Teammate Branch Integration Point) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gem-700" />
                Refine Results
              </span>
              <span className="text-[11px] font-semibold text-gem-700 bg-gem-50 px-2 py-0.5 rounded-full">
                {products.length} Items
              </span>
            </div>

            {/* Filter Placeholder Box for Kanishq's FilterSidebar */}
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
              <p className="text-xs font-semibold text-slate-700">Filter Controls</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Category, price range, and platform filters from teammate branch mount here.
              </p>
            </div>

            {/* Quick Category Tag Pills */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Categories
              </span>
              {['All', 'Laptops & Desktops', 'Printers & Scanners', 'Office Furniture', 'Air Conditioners'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    const nextQ = cat === 'All' ? '' : cat;
                    setSearchInput(nextQ);
                    setSearchParams(nextQ ? { q: nextQ } : {});
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right-Column: Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No catalog matches found for "{query}". Try checking the spelling or search by broader categories like "Printer" or "Laptop".
              </p>
            </div>
          )}

          {/* Historical Price Trend Visual Container (Phase 2 Placeholder) */}
          <PriceChartPlaceholder productName={query ? `Query: ${query}` : 'All Tracked Categories'} />
        </div>
      </div>
    </div>
  );
}
