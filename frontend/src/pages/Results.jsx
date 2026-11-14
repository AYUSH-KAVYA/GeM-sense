import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Search } from 'lucide-react';
import AnalyticsBanner from '../components/AnalyticsBanner.jsx';
import EmptyErrorState from '../components/EmptyErrorState.jsx';
import FilterSidebar, { DEFAULT_FILTERS } from '../components/FilterSidebar.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import PriceChartPlaceholder from '../components/PriceChartPlaceholder.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { fetchProducts, searchProducts } from '../services/api.js';

const FALLBACK_PRODUCTS = [
  { id: 1, name: 'Dell Latitude 5540 Laptop (i5 13th Gen, 16GB RAM, 512GB SSD)', category: 'Laptops', brand: 'Dell', modelNumber: '5540', gemUrl: 'https://mkp.gem.gov.in', latestPrices: [{ platform: 'GeM', price: 72500, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 78999, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 79490, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 2, name: 'HP LaserJet Pro MFP 4104dw Wireless All-in-One Printer', category: 'Printers', brand: 'HP', modelNumber: 'MFP4104dw', gemUrl: 'https://mkp.gem.gov.in', latestPrices: [{ platform: 'GeM', price: 38500, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 44299, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 45999, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 3, name: 'Godrej Interio Ergonomic Office Chair (Ace High Back)', category: 'Office Furniture', brand: 'Godrej Interio', modelNumber: 'ACE-HB', gemUrl: 'https://mkp.gem.gov.in', latestPrices: [{ platform: 'GeM', price: 14200, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 16850, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 15999, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 4, name: 'Canon imageCLASS MF269dw II Laser Multifunction Printer', category: 'Printers', brand: 'Canon', modelNumber: 'MF269dw-II', gemUrl: 'https://mkp.gem.gov.in', latestPrices: [{ platform: 'GeM', price: 31200, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 29499, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 30200, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 5, name: 'Daikin 1.5 Ton 5 Star Inverter Split Air Conditioner', category: 'Air Conditioners', brand: 'Daikin', modelNumber: 'MTKL50UV16', gemUrl: 'https://mkp.gem.gov.in', latestPrices: [{ platform: 'GeM', price: 42800, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 46990, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 45499, productUrl: 'https://flipkart.com', inStock: true }] },
  { id: 6, name: 'Dell OptiPlex 7010 Micro Desktop (Intel i5, 8GB, 256GB SSD)', category: 'Laptops', brand: 'Dell', modelNumber: '7010-Micro', gemUrl: 'https://mkp.gem.gov.in', latestPrices: [{ platform: 'GeM', price: 48900, productUrl: 'https://mkp.gem.gov.in', inStock: true }, { platform: 'Amazon', price: 54200, productUrl: 'https://amazon.in', inStock: true }, { platform: 'Flipkart', price: 53799, productUrl: 'https://flipkart.com', inStock: true }] },
];

const getPlatformName = (platform) => (
  typeof platform === 'string' ? platform : platform?.name
);

function normalizeProducts(response) {
  const data = Array.isArray(response) ? response : response?.data ?? response?.results;
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => ({
    ...item,
    id: item.id ?? item._id ?? item.product_id ?? `product-${index}`,
    name: item.name ?? item.title ?? 'Untitled product',
    modelNumber: item.modelNumber ?? item.model_number,
    gemPrice: item.gemPrice ?? item.gem_price ?? item.price,
  }));
}

function getFallbackProducts(query) {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return FALLBACK_PRODUCTS;
  return FALLBACK_PRODUCTS.filter((product) => (
    [product.name, product.category, product.brand, product.modelNumber]
      .some((value) => value?.toLowerCase().includes(searchTerm))
  ));
}

function getPrices(product) {
  const records = Array.isArray(product.latestPrices)
    ? product.latestPrices
    : Array.isArray(product.price_records)
      ? product.price_records
      : [];
  const normalized = records.map((record) => ({
    platform: getPlatformName(record.platform) || 'Unknown',
    price: Number(record.price),
  }));
  const hasGem = normalized.some((record) => record.platform.toLowerCase() === 'gem');
  if (!hasGem) {
    const gemPrice = Number(product.gemPrice ?? product.gem_price ?? product.price);
    if (Number.isFinite(gemPrice) && gemPrice > 0) normalized.push({ platform: 'GeM', price: gemPrice });
  }
  const competitors = product.competitors ?? {};
  for (const [platform, item] of Object.entries(competitors)) {
    if (!normalized.some((record) => record.platform.toLowerCase() === platform.toLowerCase())) {
      const price = Number(item?.price);
      if (Number.isFinite(price) && price > 0) normalized.push({ platform, price });
    }
  }
  return normalized.filter((record) => Number.isFinite(record.price) && record.price > 0);
}

export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const requestId = useRef(0);

  useEffect(() => setSearchInput(query), [query]);

  const loadProducts = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = query.trim()
        ? await searchProducts(query.trim())
        : await fetchProducts();
      const normalized = normalizeProducts(response);
      if (currentRequestId !== requestId.current) return;
      if (normalized.length) {
        setProducts(normalized);
        setUsingFallback(false);
      } else {
        setProducts(getFallbackProducts(query));
        setUsingFallback(true);
      }
    } catch (loadError) {
      if (currentRequestId !== requestId.current) return;
      setProducts(getFallbackProducts(query));
      setUsingFallback(true);
      setError(loadError?.message || 'Backend is unavailable. Showing sample products.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    setSearchParams(nextQuery ? { q: nextQuery } : {});
    setFilters((current) => ({ ...current, search: '' }));
  };

  const filteredProducts = useMemo(() => products
    .filter((product) => {
      const selectedCategories = filters.categories ?? [filters.category ?? 'All'];
      const categoryMatches = selectedCategories.includes('All')
        || selectedCategories.includes('All Categories')
        || selectedCategories.some((category) => product.category?.toLowerCase().includes(category.toLowerCase()));
      const prices = getPrices(product);
      const maxPrice = Number(filters.maxPrice);
      const priceMatches = !Number.isFinite(maxPrice)
        || prices.some((record) => record.price <= maxPrice);
      const gem = prices.find((record) => record.platform.toLowerCase() === 'gem')?.price;
      const competitorPrices = prices
        .filter((record) => record.platform.toLowerCase() !== 'gem')
        .map((record) => record.price);
      const gemCheaperMatches = !filters.gemCheaperOnly
        || (gem != null && competitorPrices.length > 0 && gem <= Math.min(...competitorPrices));
      const searchTerm = (filters.search ?? '').trim().toLowerCase();
      const searchMatches = !searchTerm
        || [product.name, product.category, product.brand, product.modelNumber]
          .some((value) => value?.toLowerCase().includes(searchTerm));
      return categoryMatches && priceMatches && gemCheaperMatches && searchMatches;
    })
    .sort((a, b) => {
      const pricesA = getPrices(a);
      const pricesB = getPrices(b);
      const minA = Math.min(...pricesA.map((record) => record.price), Infinity);
      const minB = Math.min(...pricesB.map((record) => record.price), Infinity);
      const gemA = pricesA.find((record) => record.platform.toLowerCase() === 'gem')?.price ?? 0;
      const gemB = pricesB.find((record) => record.platform.toLowerCase() === 'gem')?.price ?? 0;
      const compsA = pricesA.filter((record) => record.platform.toLowerCase() !== 'gem');
      const compsB = pricesB.filter((record) => record.platform.toLowerCase() !== 'gem');
      const savingsA = compsA.length ? Math.max(...compsA.map((record) => (record.price - gemA) / record.price)) : 0;
      const savingsB = compsB.length ? Math.max(...compsB.map((record) => (record.price - gemB) / record.price)) : 0;
      if (filters.sortBy === 'price_asc') return minA - minB;
      if (filters.sortBy === 'price_desc') return minB - minA;
      if (filters.sortBy === 'rating_desc') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      return savingsB - savingsA;
    }), [products, filters]);

  const quickSearch = (nextQuery) => {
    setSearchInput(nextQuery);
    setSearchParams({ q: nextQuery });
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link to="/" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-gem-700">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview
            </Link>
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Cross-Platform Price Comparison</h1>
            <p className="mt-1 text-xs text-slate-500">Comparing GeM portal rate contracts with Amazon India and Flipkart pricing</p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search product, model, or GeM URL..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-gem-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gem-600" />
            </div>
            <button type="submit" className="rounded-xl bg-gem-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-gem-800">Search</button>
          </form>
        </div>
        {usingFallback && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            {error || 'No API products were returned — showing sample reference products.'}
          </div>
        )}
      </header>

      {!loading && filteredProducts.length > 0 && <AnalyticsBanner products={filteredProducts} />}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <FilterSidebar filters={filters} onFilterChange={setFilters} />
        </div>
        <section className="min-w-0 space-y-6 lg:col-span-3" aria-label="Product results">
          {!loading && (
            <p className="text-sm font-semibold text-slate-600">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</p>
          )}
          {loading ? (
            <LoadingSkeleton />
          ) : filteredProducts.length === 0 ? (
            <EmptyErrorState
              type="empty"
              onRetry={loadProducts}
              onQuickSearch={quickSearch}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
              <PriceChartPlaceholder productId={filteredProducts[0].id} product={filteredProducts[0]} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
