import { Link, NavLink } from 'react-router-dom';
import { Landmark, Search, ShieldCheck } from 'lucide-react';

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-50 text-navy' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
  }`;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="GeM Compare home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-white shadow-sm">
            <Landmark size={21} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-[17px] font-extrabold tracking-tight text-ink">GeM<span className="text-emerald-700">Compare</span></span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">Procurement intelligence</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/results" className={navClass}>Price comparison</NavLink>
          <a href="https://gem.gov.in/" target="_blank" rel="noreferrer" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink">Official GeM</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 md:inline-flex">
            <ShieldCheck size={14} /> Public data
          </span>
          <Link to="/results" className="inline-flex items-center gap-2 rounded-xl bg-navy px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950">
            <Search size={16} /> <span className="hidden xs:inline">Compare prices</span><span className="xs:hidden">Compare</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
