import { useState } from "react";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  IndianRupee,
} from "lucide-react";

const CATEGORIES = [
  "All Categories",
  "Laptops & Desktops",
  "Printers & Scanners",
  "Office Furniture",
  "Air Conditioners",
  "Networking Equipment",
  "Projectors & Displays",
  "UPS & Power",
  "Stationery & Supplies",
];

const PLATFORMS = [
  { key: "GeM", label: "GeM", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "Amazon", label: "Amazon", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "Flipkart", label: "Flipkart", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
];

const SORT_OPTIONS = [
  { key: "savings_desc", label: "Highest Savings %" },
  { key: "price_asc", label: "Lowest Price First" },
  { key: "price_desc", label: "Highest Price First" },
  { key: "rating_desc", label: "Best Rating" },
  { key: "newest", label: "Newest First" },
];

const DEFAULT_FILTERS = {
  category: "All Categories",
  minPrice: "",
  maxPrice: "",
  platforms: ["GeM", "Amazon", "Flipkart"],
  sortBy: "savings_desc",
};

export default function FilterSidebar({ filters = DEFAULT_FILTERS, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false); // mobile toggle
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    platform: true,
    sort: true,
  });

  const currentFilters = { ...DEFAULT_FILTERS, ...filters };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key, value) => {
    if (onFilterChange) {
      onFilterChange({ ...currentFilters, [key]: value });
    }
  };

  const togglePlatform = (platformKey) => {
    const current = currentFilters.platforms || [];
    const updated = current.includes(platformKey)
      ? current.filter((p) => p !== platformKey)
      : [...current, platformKey];
    // Always keep at least one platform selected
    if (updated.length > 0) {
      updateFilter("platforms", updated);
    }
  };

  const clearAllFilters = () => {
    if (onFilterChange) {
      onFilterChange({ ...DEFAULT_FILTERS });
    }
  };

  const hasActiveFilters =
    currentFilters.category !== DEFAULT_FILTERS.category ||
    currentFilters.minPrice !== "" ||
    currentFilters.maxPrice !== "" ||
    currentFilters.platforms.length !== DEFAULT_FILTERS.platforms.length ||
    currentFilters.sortBy !== DEFAULT_FILTERS.sortBy;

  const SectionHeader = ({ title, sectionKey }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full py-2 text-sm font-semibold text-slate-800 hover:text-blue-700 transition-colors"
    >
      <span>{title}</span>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );

  const filterContent = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="font-bold text-sm">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── Category ───────────────────── */}
      <div>
        <SectionHeader title="Category" sectionKey="category" />
        {expandedSections.category && (
          <div className="mt-1 space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => updateFilter("category", cat)}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  currentFilters.category === cat
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── Price Range ────────────────── */}
      <div>
        <SectionHeader title="Price Range" sectionKey="price" />
        {expandedSections.price && (
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                placeholder="Min"
                value={currentFilters.minPrice}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
                className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
            <span className="text-slate-400 text-xs font-medium">to</span>
            <div className="relative flex-1">
              <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                placeholder="Max"
                value={currentFilters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
                className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── Platform Availability ──────── */}
      <div>
        <SectionHeader title="Platform" sectionKey="platform" />
        {expandedSections.platform && (
          <div className="mt-2 space-y-2">
            {PLATFORMS.map((platform) => {
              const isActive = currentFilters.platforms.includes(platform.key);
              return (
                <button
                  key={platform.key}
                  onClick={() => togglePlatform(platform.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isActive
                      ? platform.color
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? "border-current bg-current"
                        : "border-slate-300"
                    }`}
                  >
                    {isActive && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span>{platform.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── Sort Order ─────────────────── */}
      <div>
        <SectionHeader title="Sort By" sectionKey="sort" />
        {expandedSections.sort && (
          <div className="mt-1 space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => updateFilter("sortBy", opt.key)}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  currentFilters.sortBy === opt.key
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle filters"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          bg-white border border-slate-200 rounded-2xl p-5 shadow-sm
          lg:sticky lg:top-24 lg:block lg:w-64 lg:flex-shrink-0
          ${isOpen
            ? "fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] rounded-l-2xl rounded-r-none overflow-y-auto animate-slide-in"
            : "hidden"
          }
        `}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        {filterContent}
      </aside>
    </>
  );
}
