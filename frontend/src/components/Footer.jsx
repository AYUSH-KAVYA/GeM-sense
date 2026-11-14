import { Link } from "react-router-dom";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

const CATEGORIES = [
  { label: "Laptops", query: "Laptops" },
  { label: "Printers", query: "Printers" },
  { label: "Office Chairs", query: "Office+Chairs" },
  { label: "Air Conditioners", query: "Air+Conditioners" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white">
              <ShieldCheck className="w-7 h-7 text-blue-400" />
              <span className="text-2xl font-bold tracking-tight">
                GeM-sense
              </span>
            </Link>

            <p className="mt-4 text-sm leading-6 text-slate-400 max-w-sm">
              Automated Cost Comparison Gateway for Public Procurement.
              Bringing transparency and smarter price intelligence to
              government purchasing.
            </p>

            <div className="mt-5 inline-flex rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-300">
              Ministry of Commerce and Industries | Smart Automation (Software)
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Quick Categories
            </h3>
            <ul className="mt-5 space-y-3">
              {CATEGORIES.map((category) => (
                <li key={category.label}>
                  <Link
                    to={`/results?q=${category.query}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {category.label}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Transparency & Disclaimer
            </h3>
            <p className="mt-5 text-sm leading-6 text-slate-400">
              Real-time marketplace prices are fetched for benchmarking and
              procurement decision support. Prices, availability, and product
              specifications may change on the respective marketplaces.
              Always verify current listing details before making procurement
              decisions.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} GeM-sense. Built for smarter public
            procurement.
          </p>
          <p>Price intelligence for informed procurement decisions.</p>
        </div>
      </div>
    </footer>
  );
}
