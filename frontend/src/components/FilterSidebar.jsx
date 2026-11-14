import { useState } from "react";
import {
  SlidersHorizontal,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Laptops",
  "Printers",
  "Office Furniture",
  "Air Conditioners",
];

const SORT_OPTIONS = [
  { key: "savings_desc", label: "Highest Savings %" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "rating_desc", label: "Best Customer Rating" },
];

export const DEFAULT_FILTERS = {
  search: "",
  category: "All",
  categories: ["All"],
  maxPrice: 150000,
  sortBy: "savings_desc",
  gemCheaperOnly: false,
};

/**
 * FilterSidebar — Interactive sidebar for filtering and sorting procurement items.
 *
 * Provides controls for:
 *   1. Search within results (name, description keyword)
 *   2. Category checkboxes (All, Laptops, Printers, Office Furniture, Air Conditioners)
 *   3. Price Range (Slider controlling maxPrice)
 *   4. Sort By dropdown (savings_desc, price_asc, price_desc, rating_desc)
 *   5. Toggle switch ("Only show items where GeM is cheaper")
 *   6. Clear All Filters button
 *
 * @param {object} props
 * @param {object} [props.filters] - Current filter state.
 * @param {function} [props.onFilterChange] - Callback when any filter changes.
 * @param {function} [props.onReset] - Optional callback when filters are cleared.
 */
export default function FilterSidebar({
  filters = {},
  onFilterChange = () => {},
  onReset,
}) {
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer toggle
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    category: true,
    price: true,
    sort: true,
    toggle: true,
  });

  // ── Safe Defaults Fallback ──────────────────────────────────────
  const currentSearch = filters?.search ?? filters?.query ?? filters?.q ?? DEFAULT_FILTERS.search;
  const currentMaxPrice =
    filters?.maxPrice !== undefined && filters?.maxPrice !== "" && !isNaN(Number(filters.maxPrice))
      ? Number(filters.maxPrice)
      : DEFAULT_FILTERS.maxPrice;
  const currentSortBy = filters?.sortBy ?? DEFAULT_FILTERS.sortBy;
  const currentGemCheaperOnly = Boolean(
    filters?.gemCheaperOnly ?? filters?.isGeMCheapest ?? DEFAULT_FILTERS.gemCheaperOnly
  );

  // Normalize selected categories into an array
  let selectedCategories = [];
  if (Array.isArray(filters?.categories) && filters.categories.length > 0) {
    selectedCategories = filters.categories;
  } else if (typeof filters?.category === "string" && filters.category.trim()) {
    const rawCat = filters.category.trim();
    if (rawCat === "All Categories" || rawCat === "All") {
      selectedCategories = ["All"];
    } else {
      selectedCategories = [rawCat];
    }
  } else {
    selectedCategories = ["All"];
  }

  const currentFilters = {
    ...DEFAULT_FILTERS,
    ...filters,
    search: currentSearch,
    category: selectedCategories.length === 1 ? selectedCategories[0] : (selectedCategories.includes("All") ? "All" : selectedCategories.join(", ")),
    categories: selectedCategories,
    maxPrice: currentMaxPrice,
    sortBy: currentSortBy,
    gemCheaperOnly: currentGemCheaperOnly,
  };

  // ── Handlers ───────────────────────────────────────────────────
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key, value) => {
    if (typeof onFilterChange === "function") {
      const updated = {
        ...currentFilters,
        [key]: value,
      };
      // Keep query aliases aligned for search
      if (key === "search") {
        updated.query = value;
        updated.q = value;
      }
      onFilterChange(updated);
    }
  };

  const handleCategoryToggle = (categoryName) => {
    let nextCategories = [];

    if (categoryName === "All") {
      nextCategories = ["All"];
    } else {
      const withoutAll = selectedCategories.filter((c) => c !== "All");
      if (withoutAll.includes(categoryName)) {
        nextCategories = withoutAll.filter((c) => c !== categoryName);
        if (nextCategories.length === 0) {
          nextCategories = ["All"];
        }
      } else {
        nextCategories = [...withoutAll, categoryName];
        // If all 4 non-All categories are checked, consolidate to "All"
        const nonAllCategories = CATEGORIES.filter((c) => c !== "All");
        if (nonAllCategories.every((c) => nextCategories.includes(c))) {
          nextCategories = ["All"];
        }
      }
    }

    const primaryCategory =
      nextCategories.length === 1
        ? nextCategories[0]
        : nextCategories.includes("All")
        ? "All"
        : nextCategories[0];

    if (typeof onFilterChange === "function") {
      onFilterChange({
        ...currentFilters,
        category: primaryCategory,
        categories: nextCategories,
      });
    }
  };

  const handleReset = () => {
    if (typeof onReset === "function") {
      onReset();
    }
    if (typeof onFilterChange === "function") {
      onFilterChange({
        ...DEFAULT_FILTERS,
        query: "",
        q: "",
      });
    }
  };

  const hasActiveFilters =
    Boolean(currentSearch) ||
    !selectedCategories.includes("All") ||
    currentMaxPrice !== DEFAULT_FILTERS.maxPrice ||
    currentSortBy !== DEFAULT_FILTERS.sortBy ||
    currentGemCheaperOnly;

  const SectionHeader = ({ title, sectionKey }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full py-1 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
    >
      <span>{title}</span>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );

  const filterContent = (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-sm tracking-tight text-slate-900">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── 1. Search Within Results ────────────────────────────── */}
      <div>
        <SectionHeader title="Search in Results" sectionKey="search" />
        {expandedSections.search && (
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, model..."
              value={currentSearch}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search within results"
            />
            {currentSearch && (
              <button
                type="button"
                onClick={() => updateFilter("search", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── 2. Category Checkboxes ──────────────────────────────── */}
      <div>
        <SectionHeader title="Category" sectionKey="category" />
        {expandedSections.category && (
          <div className="mt-2 space-y-1.5" role="group" aria-label="Category filters">
            {CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat);
              return (
                <label
                  key={cat}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCategoryToggle(cat)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition"
                  />
                  <span
                    className={`text-sm ${
                      isChecked ? "font-semibold text-blue-900" : "text-slate-600"
                    }`}
                  >
                    {cat}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── 3. Price Range Slider ───────────────────────────────── */}
      <div>
        <SectionHeader title="Price Range" sectionKey="price" />
        {expandedSections.price && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Max Price</span>
              <span className="font-bold text-slate-900">
                ₹{Number(currentMaxPrice).toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="2500"
              value={currentMaxPrice}
              onChange={(e) => updateFilter("maxPrice", Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              aria-label="Maximum price filter"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>₹0</span>
              <span>₹1,00,000</span>
              <span>₹2,00,000+</span>
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── 4. Sort By Dropdown ─────────────────────────────────── */}
      <div>
        <SectionHeader title="Sort By" sectionKey="sort" />
        {expandedSections.sort && (
          <div className="mt-2">
            <select
              value={currentSortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              aria-label="Sort products by"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── 5. Toggle Switch: GeM Cheaper Only ──────────────────── */}
      <div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/80">
          <label
            htmlFor="gem-cheaper-toggle"
            className="text-xs font-semibold text-slate-700 cursor-pointer select-none leading-snug"
          >
            Only show items where GeM is cheaper
          </label>
          <button
            id="gem-cheaper-toggle"
            type="button"
            role="switch"
            aria-checked={currentGemCheaperOnly}
            onClick={() => {
              const nextVal = !currentGemCheaperOnly;
              updateFilter("gemCheaperOnly", nextVal);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              currentGemCheaperOnly ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                currentGemCheaperOnly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── 6. Clear All Filters Button ─────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          Clear All Filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile drawer trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle filters"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          bg-white border border-slate-200 rounded-2xl p-5 shadow-xs
          lg:sticky lg:top-24 lg:block lg:w-64 lg:flex-shrink-0
          ${
            isOpen
              ? "fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] rounded-l-2xl rounded-r-none overflow-y-auto animate-slide-in"
              : "hidden"
          }
        `}
        aria-label="Product filters"
      >
        {/* Close button (mobile only) */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Close filter drawer"
        >
          <X className="w-5 h-5" />
        </button>

        {filterContent}
      </aside>
    </>
  );
}
