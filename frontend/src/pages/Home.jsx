import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar.jsx";
import {
  ShieldCheck,
  Search,
  BarChart3,
  BadgeIndianRupee,
  TrendingDown,
  Users,
  Package,
  Zap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

// ── Platform stats (will be replaced by live API data later) ──────
const PLATFORM_STATS = [
  {
    label: "Products Tracked",
    value: "12,400+",
    icon: Package,
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Avg. Savings Found",
    value: "18.6%",
    icon: TrendingDown,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Platforms Compared",
    value: "3",
    icon: BarChart3,
    color: "text-violet-600 bg-violet-50",
  },
  {
    label: "Procurement Officers",
    value: "2,100+",
    icon: Users,
    color: "text-amber-600 bg-amber-50",
  },
];

// ── "How it works" steps ──────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Paste GeM Link or Search",
    description:
      "Drop a Government e-Marketplace product URL or type a keyword like \"Dell Latitude 5540 Laptop\".",
    icon: Search,
    color: "from-blue-500 to-blue-600",
  },
  {
    step: 2,
    title: "Real-Time Cross-Market Scrape",
    description:
      "We instantly fetch live prices, ratings, and stock availability from GeM, Amazon, and Flipkart.",
    icon: Zap,
    color: "from-violet-500 to-violet-600",
  },
  {
    step: 3,
    title: "Instant Savings Verdict",
    description:
      "See side-by-side price comparisons, savings percentages, and a clear verdict on the best procurement deal.",
    icon: BadgeIndianRupee,
    color: "from-emerald-500 to-emerald-600",
  },
];

// ── Trusted-by logos / labels ─────────────────────────────────────
const TRUSTED_BY = [
  "Government e-Marketplace (GeM)",
  "Central Public Procurement Portal",
  "State Government Departments",
  "Public Sector Undertakings",
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-20 pb-16">
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative pt-12 pb-4 text-center">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/60 via-violet-100/40 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span>India&apos;s Government Procurement Intelligence Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Stop Overpaying on{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
            Government Procurement
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Compare{" "}
          <strong className="text-slate-800">
            GeM catalog prices
          </strong>{" "}
          against Amazon and Flipkart in real time. Ensure compliance, verify
          market rates, and save taxpayer money.
        </p>

        {/* Search Bar */}
        <div className="mt-10">
          <SearchBar />
        </div>

        {/* Trust signal */}
        <p className="mt-6 text-xs text-slate-400 max-w-md mx-auto">
          Completely free. No login needed. Data sourced from live marketplace listings.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PLATFORM STATS BAR
         ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATFORM_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS — 3-step visual
         ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          How GeM-sense Works
        </h2>
        <p className="mt-2 text-slate-500 text-base max-w-xl mx-auto">
          Three simple steps to verify you&apos;re getting the best deal on government procurement
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-200" />

          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-lg mb-5 relative z-10`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                {/* Step number */}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Step {item.step}
                </span>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA — Try a Sample Search
         ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-3xl p-10 text-center text-white shadow-xl relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

          <h2 className="text-2xl sm:text-3xl font-bold relative z-10">
            Ready to find savings?
          </h2>
          <p className="mt-3 text-blue-100 text-base max-w-md mx-auto relative z-10">
            Try comparing a product right now — no signup required.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <button
              onClick={() => navigate("/results?q=HP+LaserJet+Printer")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>Try &ldquo;HP LaserJet Printer&rdquo;</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://mkp.gem.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              <span>Visit Official GeM Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TRUSTED BY
         ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto text-center">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-4">
          Built for
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {TRUSTED_BY.map((org) => (
            <span
              key={org}
              className="text-sm text-slate-500 font-medium"
            >
              {org}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
