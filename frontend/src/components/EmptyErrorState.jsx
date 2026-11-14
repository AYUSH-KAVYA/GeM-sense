import React from "react";
import { AlertTriangle, SearchX, RotateCcw, Search, Sparkles } from "lucide-react";

const QUICK_SEARCH_CHIPS = [
  "Dell Latitude i5 Laptop",
  "HP LaserJet Pro MFP",
  "Godrej High Back Chair",
  "Daikin 1.5 Ton Inverter AC",
];

/**
 * EmptyErrorState — Comprehensive empty and error fallback view.
 *
 * Supports:
 *   - Error state: High-visibility warning when API/data fetching fails.
 *   - Empty state: Guided recovery when search/filters return zero results.
 *
 * Includes:
 *   - "Retry Connection" action button connected to onRetry.
 *   - 4 quick-search suggestion chips connected to onQuickSearch.
 *
 * @param {object} props
 * @param {'empty'|'error'} [props.type='empty'] - Type of state to display.
 * @param {string} [props.message] - Custom message text.
 * @param {function} [props.onRetry] - Callback invoked when "Retry Connection" is clicked.
 * @param {function} [props.onQuickSearch] - Callback invoked with the chip text when a quick search chip is clicked.
 */
export default function EmptyErrorState({
  type = "empty",
  message,
  onRetry,
  onQuickSearch,
}) {
  const isError = type === "error";

  const title = isError
    ? "Unable to Load Procurement Data"
    : "No Procurement Items Found";

  const defaultExplanation = isError
    ? "Could not establish a connection to the GeM-sense backend service. Please check your network or server status and retry."
    : "No products matched your active search query or filter criteria. Try adjusting your keywords or browse popular equipment categories below.";

  const explanation = message || defaultExplanation;

  const handleRetry = () => {
    if (typeof onRetry === "function") {
      onRetry();
    }
  };

  const handleChipClick = (query) => {
    if (typeof onQuickSearch === "function") {
      onQuickSearch(query);
    }
  };

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className="mx-auto my-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-soft"
    >
      {/* State Icon */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
        {isError ? (
          <AlertTriangle className="h-7 w-7 text-amber-500" aria-hidden="true" />
        ) : (
          <SearchX className="h-7 w-7 text-blue-600" aria-hidden="true" />
        )}
      </div>

      {/* Title & Explanation */}
      <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {explanation}
      </p>

      {/* Action Button: Retry Connection */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          aria-label="Retry Connection"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>

      {/* Quick Search Chips Divider */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Try quick searches for common government procurement items:</span>
        </div>

        {/* 4 Clickable Quick Search Chips */}
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="Quick search suggestions"
        >
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              aria-label={`Search for ${chip}`}
            >
              <Search className="w-3 h-3 text-slate-400" />
              <span>{chip}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

