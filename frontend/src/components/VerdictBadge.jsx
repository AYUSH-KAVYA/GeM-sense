import React from "react";
import {
  ShieldCheck,
  TrendingDown,
  AlertOctagon,
  HelpCircle,
} from "lucide-react";
import { generateProcurementVerdict } from "../../../backend/src/utils/verdict.js";

// Re-export for convenience across frontend components
export { generateProcurementVerdict };

/**
 * VerdictBadge — Procurement verdict badge for cross-platform price intelligence.
 *
 * Displays a color-coded, accessible status pill based on the procurement verdict:
 *   - GEM_OPTIMAL: Emerald badge indicating direct GeM purchase clearance.
 *   - MARKET_CHEAPER: Amber badge alerting buyers to lower external commercial prices.
 *   - PRICE_ANOMALY: Red badge signaling extreme variance (> 35%) requiring spec audits.
 *
 * @param {object} props
 * @param {number|string} [props.gemPrice] - Price on GeM portal.
 * @param {any} [props.competitorPrices] - Competitor prices (array or object).
 * @param {object} [props.verdict] - Optional pre-computed verdict object.
 * @param {string} [props.className] - Optional custom CSS classes.
 * @param {boolean} [props.showTooltip=true] - Whether to show recommendation text on hover.
 */
export default function VerdictBadge({
  gemPrice,
  competitorPrices,
  verdict,
  className = "",
  showTooltip = true,
}) {
  // If verdict is supplied, use it; otherwise compute it dynamically
  const activeVerdict =
    verdict && typeof verdict === "object" && verdict.status
      ? verdict
      : generateProcurementVerdict(gemPrice, competitorPrices);

  const status = activeVerdict?.status;
  const tooltipText = showTooltip ? activeVerdict?.recommendationText : undefined;

  // ── 1. GEM_OPTIMAL: Best Rate on GeM ──────────────────────────────
  if (status === "GEM_OPTIMAL") {
    return (
      <div
        role="status"
        aria-label="Procurement verdict: Best Rate on GeM — Approved for Direct Purchase"
        title={tooltipText}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs transition-colors hover:bg-emerald-100/80 ${className}`.trim()}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
        <span className="truncate">Best Rate on GeM — Approved for Direct Purchase</span>
      </div>
    );
  }

  // ── 2. MARKET_CHEAPER: Commercial Platform is Cheaper ─────────────
  if (status === "MARKET_CHEAPER") {
    const platform = activeVerdict.lowestPlatform || "Commercial Market";
    const percent =
      activeVerdict.savingsPercent !== undefined && activeVerdict.savingsPercent !== null
        ? Math.round(activeVerdict.savingsPercent)
        : null;
    const dynamicLabel =
      percent !== null
        ? `${percent}% Cheaper on ${platform} — Negotiate GeM Rate`
        : `Cheaper on ${platform} — Negotiate GeM Rate`;

    return (
      <div
        role="status"
        aria-label={`Procurement verdict: ${dynamicLabel}`}
        title={tooltipText}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs transition-colors hover:bg-amber-100/80 ${className}`.trim()}
      >
        <TrendingDown className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
        <span className="truncate">{dynamicLabel}</span>
      </div>
    );
  }

  // ── 3. PRICE_ANOMALY: High Price Variance (> 35%) ─────────────────
  if (status === "PRICE_ANOMALY") {
    return (
      <div
        role="status"
        aria-label="Procurement verdict: High Price Variance — Verify Model Specs"
        title={tooltipText}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-300 shadow-xs transition-colors hover:bg-red-100/80 ${className}`.trim()}
      >
        <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
        <span className="truncate">High Price Variance — Verify Model Specs</span>
      </div>
    );
  }

  // ── Fallback for Missing or Invalid State ─────────────────────────
  return (
    <div
      role="status"
      aria-label="Procurement verdict: Pending Price Verification"
      title="Pricing data incomplete for comparison."
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 ${className}`.trim()}
    >
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      <span className="truncate">Pending Price Verification</span>
    </div>
  );
}

