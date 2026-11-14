import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ShieldCheck, ExternalLink, Menu, X } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export default function Navbar() {
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/products`, { signal: controller.signal })
      .then((response) => setBackendOnline(response.ok))
      .catch((error) => { if (error.name !== 'AbortError') setBackendOnline(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  const linkClass = (path) => `block text-sm font-semibold transition-colors ${location.pathname === path || (path === '/results' && location.pathname.startsWith('/results')) ? 'text-gem-700' : 'text-slate-600 hover:text-gem-700'}`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gem-700 text-white flex items-center justify-center shadow-sm group-hover:bg-gem-800 transition-colors flex-shrink-0"><Layers className="w-5 h-5" /></div>
          <div className="flex flex-col min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg leading-none">GeM <span className="text-gem-700">Compare</span></span><span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${backendOnline === true ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}><span className={`w-1.5 h-1.5 rounded-full ${backendOnline === true ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />{backendOnline === true ? 'Live Market Sync' : 'Demo Cache Mode'}</span></div><span className="hidden sm:block text-[11px] text-slate-500 font-medium tracking-tight">Procurement Intelligence & Price Verification</span></div>
        </Link>
        <nav className="hidden md:flex items-center gap-5 lg:gap-6"><Link to="/" className={linkClass('/')}>Home</Link><Link to="/results" className={linkClass('/results')}>Audit Dashboard</Link><span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium pl-4 border-l border-slate-200"><ShieldCheck className="w-4 h-4 text-gem-700" />GovTech Certified</span><a href="https://mkp.gem.gov.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-gem-600 hover:text-gem-700 transition-colors"><span>Official GeM</span><ExternalLink className="w-3 h-3" /></a></nav>
        <button type="button" onClick={() => setMobileOpen((open) => !open)} className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div>
      {mobileOpen && <nav className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4 shadow-lg"><Link to="/" className={linkClass('/')}>Home</Link><Link to="/results" className={linkClass('/results')}>Audit Dashboard</Link><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="w-4 h-4 text-gem-700" />GovTech Certified</div><a href="https://mkp.gem.gov.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">Official GeM <ExternalLink className="w-3 h-3" /></a></nav>}
    </header>
  );
}
