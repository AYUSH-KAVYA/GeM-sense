import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Link2, ArrowRight } from "lucide-react";

const QUICK_CATEGORIES = [
  { label: "Laptops", emoji: "💻" },
  { label: "Office Chairs", emoji: "🪑" },
  { label: "Printers", emoji: "🖨️" },
  { label: "ACs", emoji: "❄️" },
  { label: "Desktops", emoji: "🖥️" },
  { label: "Projectors", emoji: "📽️" },
];

const GEM_URL_PATTERN = /^https?:\/\/(mkp\.)?gem\.gov\.in/i;

export default function SearchBar({ className = "" }) {
  const [query, setQuery] = useState("");
  const [inputType, setInputType] = useState("keyword"); // "keyword" | "url"
  const navigate = useNavigate();

  // Auto-detect if user pastes a GeM URL
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setInputType(GEM_URL_PATTERN.test(value.trim()) ? "url" : "keyword");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/results?q=${encodeURIComponent(trimmed)}`);
  };

  const handleQuickSearch = (category) => {
    setQuery(category);
    navigate(`/results?q=${encodeURIComponent(category)}`);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Main Search Form */}
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
          {/* Icon indicator */}
          <div className="pl-4 text-slate-400 flex-shrink-0">
            {inputType === "url" ? (
              <Link2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder='Search "HP LaserJet Printer" or paste a GeM product URL...'
            className="flex-1 py-4 px-3 text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none text-base"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={!query.trim()}
            className="mr-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-150 flex items-center gap-2 text-sm"
          >
            <span>Compare</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* URL detected hint */}
        {inputType === "url" && (
          <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1 pl-1">
            <Link2 className="w-3.5 h-3.5" />
            GeM product URL detected — we&apos;ll fetch and compare across platforms
          </p>
        )}
      </form>

      {/* Quick Category Pills */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-slate-500 font-medium mr-1">
          Quick search:
        </span>
        {QUICK_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => handleQuickSearch(cat.label)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all duration-150 shadow-sm"
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
