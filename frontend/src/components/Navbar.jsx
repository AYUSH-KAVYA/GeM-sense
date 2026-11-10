import { Link, useLocation } from 'react-router-dom';
import { Layers, ShieldCheck, Activity, ExternalLink } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gem-700 text-white flex items-center justify-center shadow-sm group-hover:bg-gem-800 transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-none">
                GeM <span className="text-gem-700">Compare</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Index
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium tracking-tight">
              Procurement Intelligence & Price Verification
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm font-semibold transition-colors ${
              location.pathname === '/'
                ? 'text-gem-700'
                : 'text-slate-600 hover:text-gem-700'
            }`}
          >
            Home
          </Link>
          <Link
            to="/results"
            className={`text-sm font-semibold transition-colors ${
              location.pathname.startsWith('/results')
                ? 'text-gem-700'
                : 'text-slate-600 hover:text-gem-700'
            }`}
          >
            Price Comparison
          </Link>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-gem-700" />
              GovTech Certified
            </span>
          </div>

          <a
            href="https://mkp.gem.gov.in"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-gem-600 hover:text-gem-700 transition-colors"
          >
            <span>Official GeM</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>
      </div>
    </header>
  );
}
