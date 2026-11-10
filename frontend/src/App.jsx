import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Results from './pages/Results.jsx';
import { Search, ArrowRight, ShieldCheck, TrendingDown, Layers, Sparkles } from 'lucide-react';

// Temporary landing view until teammate's Home.jsx is merged into main
function HomePlaceholder() {
  return (
    <div className="py-12 space-y-12 text-center max-w-4xl mx-auto">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gem-50 border border-gem-200 text-gem-700 text-xs font-semibold">
        <ShieldCheck className="w-4 h-4 text-gem-600" />
        <span>Phase 1 Architecture Skeleton — GeM Price Verification</span>
      </div>

      {/* Hero Title */}
      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
        Real-Time Price Intelligence for <br />
        <span className="text-gem-700">Government e-Marketplace (GeM)</span>
      </h1>

      <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
        Verify GeM contract rates against open-market commercial pricing across Amazon and Flipkart before issuing purchase orders.
      </p>

      {/* CTA Button to Results Dashboard */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/results"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-gem-700 hover:bg-gem-800 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:shadow-lg"
        >
          <span>Explore Price Comparison Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/results?q=printer"
          className="inline-flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-300 hover:border-gem-600 hover:text-gem-700 text-slate-700 font-semibold text-sm rounded-xl transition-colors shadow-2xs"
        >
          <Search className="w-4 h-4" />
          <span>Sample Search: Printers</span>
        </Link>
      </div>

      {/* Value Prop Teaser Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-left">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-gem-50 text-gem-700 flex items-center justify-center mb-3">
            <TrendingDown className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800">Identify Savings</h3>
          <p className="text-xs text-slate-500 mt-1">
            Calculate percentage delta between GeM L1 prices and competitor rates instantly.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800">Audit Compliance</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ensure reasonable market rates under GFR Rule 149 public procurement mandates.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800">Branch Integration</h3>
          <p className="text-xs text-slate-500 mt-1">
            Kanishq&apos;s full-featured Home.jsx and SearchBar.jsx will drop in here seamlessly on merge.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={<HomePlaceholder />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gem-700" />
              <span className="font-semibold text-slate-700">GeM Compare</span>
              <span>— Phase 1 Core Architecture</span>
            </div>
            <p>Developed for Public Procurement Price Verification</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
