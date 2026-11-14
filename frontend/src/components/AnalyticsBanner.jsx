import React, { useMemo } from "react";
import {
  FileSpreadsheet,
  ShieldCheck,
  TrendingDown,
  IndianRupee,
  Download,
  BarChart3,
} from "lucide-react";
import { downloadProcurementCSV } from "../utils/exportReport.js";

/**
 * Extracts numeric price from a field or nested object.
 */
function getPriceNumber(val) {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Extracts GeM and competitor prices from any product object format.
 */
function extractPrices(product) {
  let gemPrice = null;
  const competitorPrices = [];

  // 1. Check latestPrices or price_records
  const priceList = Array.isArray(product?.latestPrices)
    ? product.latestPrices
    : Array.isArray(product?.price_records)
    ? product.price_records
    : [];

  for (const record of priceList) {
    if (!record) continue;
    const pName = (
      typeof record.platform === "string"
        ? record.platform
        : record.platform?.name || ""
    ).toLowerCase();
    const price = getPriceNumber(record.price);

    if (price !== null) {
      if (pName === "gem") {
        gemPrice = price;
      } else {
        competitorPrices.push(price);
      }
    }
  }

  // 2. Fallbacks for direct properties
  if (gemPrice === null) {
    gemPrice = getPriceNumber(
      product?.gemPrice ?? product?.gem_price ?? product?.price
    );
  }

  const amazon = getPriceNumber(
    product?.competitors?.amazon?.price ??
    product?.amazonPrice ??
    product?.amazon_price
  );
  if (amazon !== null && !competitorPrices.includes(amazon)) {
    competitorPrices.push(amazon);
  }

  const flipkart = getPriceNumber(
    product?.competitors?.flipkart?.price ??
    product?.flipkartPrice ??
    product?.flipkart_price
  );
  if (flipkart !== null && !competitorPrices.includes(flipkart)) {
    competitorPrices.push(flipkart);
  }

  return { gemPrice, competitorPrices };
}

/**
 * AnalyticsBanner — Executive KPI summary banner for procurement intelligence.
 *
 * Computes 4 dynamic KPIs:
 *   1. Total Audited Items: Count of all analyzed products.
 *   2. GeM Optimal Rate: Percentage where GeM has the lowest rate.
 *   3. Avg. Market Variance: Average percentage variance between GeM and external marketplaces.
 *   4. Max Potential Savings: Highest single-unit cost variance in INR.
 *
 * @param {object} props
 * @param {Array<object>} [props.products=[]] - Product array to analyze.
 * @param {function} [props.onExportCSV] - Optional callback fired when CSV is exported.
 */
export default function AnalyticsBanner({ products = [], onExportCSV }) {
  const safeProducts = Array.isArray(products) ? products : [];

  // Compute 4 dynamic KPIs
  const { totalAudited, gemOptimalRate, avgVariance, maxPotentialSavings } =
    useMemo(() => {
      const total = safeProducts.length;
      if (total === 0) {
        return {
          totalAudited: 0,
          gemOptimalRate: 0,
          avgVariance: 0,
          maxPotentialSavings: 0,
        };
      }

      let gemLowestCount = 0;
      let comparableProducts = 0;
      let totalVariance = 0;
      let varianceComparisons = 0;
      let maxSavings = 0;

      for (const product of safeProducts) {
        const { gemPrice, competitorPrices } = extractPrices(product);

        if (gemPrice === null || competitorPrices.length === 0) {
          continue;
        }

        comparableProducts++;

        const lowestComp = Math.min(...competitorPrices);

        // GeM is optimal when it is no more expensive than every competitor.
        if (gemPrice <= lowestComp) {
          gemLowestCount++;
        }

        // Compare GeM against every available commercial marketplace.
        for (const competitorPrice of competitorPrices) {
          const maxPrice = Math.max(gemPrice, competitorPrice);

          if (maxPrice > 0) {
            const variancePct =
              (Math.abs(gemPrice - competitorPrice) / maxPrice) * 100;

            totalVariance += variancePct;
            varianceComparisons++;
          }
        }

        // Maximum single-unit price difference against the cheapest competitor.
        const savings = Math.abs(gemPrice - lowestComp);
        maxSavings = Math.max(maxSavings, savings);
      }

      const optimalRate =
        comparableProducts > 0
          ? Math.round((gemLowestCount / comparableProducts) * 100)
          : 0;

      const averageVar =
        varianceComparisons > 0
          ? Number((totalVariance / varianceComparisons).toFixed(1))
          : 0;

      return {
        totalAudited: total,
        gemOptimalRate: optimalRate,
        avgVariance: averageVar,
        maxPotentialSavings: Math.round(maxSavings),
      };
    }, [safeProducts]);

  const handleExport = () => {
    // 1. Trigger the required CSV download
    downloadProcurementCSV(safeProducts);

    // 2. Respect optional onExportCSV callback if provided
    if (typeof onExportCSV === "function") {
      onExportCSV(safeProducts);
    }
  };

  return (
    <section
      aria-label="Procurement Analytics Overview"
      className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-soft"
    >
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Procurement Analytics</span>
          </div>
          <h2 className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Market Intelligence Overview
          </h2>
          <p className="text-xs text-slate-500">
            Real-time pricing KPIs across GeM, Amazon, and Flipkart catalogs.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            aria-label="Export procurement audit report as CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Dynamic KPI Cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* KPI 1: Total Audited Items */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-600">Total Audited Items</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              {totalAudited}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Tracked procurement models</p>
        </div>

        {/* KPI 2: GeM Optimal Rate */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-600">GeM Optimal Rate</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold tracking-tight text-emerald-700">
              {gemOptimalRate}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Lowest or competitive on GeM</p>
        </div>

        {/* KPI 3: Avg. Market Variance */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-600">Avg. Market Variance</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              {avgVariance}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Mean gap vs. commercial market</p>
        </div>

        {/* KPI 4: Max Potential Savings */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
              <IndianRupee className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-600">Max Potential Savings</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              ₹{maxPotentialSavings.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Single-unit negotiation headroom</p>
        </div>
      </div>
    </section>
  );
}

