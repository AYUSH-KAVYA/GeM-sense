/**
 * exportReport.js — Procurement Audit CSV Exporter
 *
 * Generates and triggers browser download of procurement comparison audit data
 * in standard RFC 4180 CSV format.
 */

/**
 * Escapes fields containing commas, double quotes, or newlines per RFC 4180.
 *
 * @param {any} value - Cell value to format.
 * @returns {string} Escaped CSV string.
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Validates and extracts a positive finite number.
 *
 * @param {any} val - Value to parse.
 * @returns {number|null} Clean numeric value or null.
 */
function getPriceNumber(val) {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Normalizes multi-platform pricing for a product object across all supported formats.
 *
 * @param {object} product - Raw or normalized product object.
 * @returns {{ gem: number|null, amazon: number|null, flipkart: number|null }}
 */
function extractPlatformPrices(product) {
  let gem = null;
  let amazon = null;
  let flipkart = null;

  // 1. Check latestPrices or price_records array
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
    const pVal = getPriceNumber(record.price);

    if (pVal !== null) {
      if (pName === "gem") gem = pVal;
      else if (pName === "amazon") amazon = pVal;
      else if (pName === "flipkart") flipkart = pVal;
    }
  }

  // 2. Direct property fallbacks
  if (gem === null) {
    gem = getPriceNumber(product?.gemPrice ?? product?.gem_price ?? product?.price);
  }
  if (amazon === null) {
    amazon = getPriceNumber(
      product?.competitors?.amazon?.price ??
      product?.amazonPrice ??
      product?.amazon_price
    );
  }
  if (flipkart === null) {
    flipkart = getPriceNumber(
      product?.competitors?.flipkart?.price ??
      product?.flipkartPrice ??
      product?.flipkart_price
    );
  }

  return { gem, amazon, flipkart };
}

/**
 * Formats date into YYYY-MM-DD.
 *
 * @param {Date} [date] - Date object.
 * @returns {string} Formatted date string.
 */
function getFormattedDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Exports products to a procurement audit CSV file and triggers browser download.
 *
 * Columns:
 *   Product Name, Category, Model Number, GeM Price (INR), Amazon Price (INR),
 *   Flipkart Price (INR), Lowest Platform, Potential Savings per Unit (INR),
 *   Savings %, Procurement Verdict
 *
 * @param {Array<object>} products - Array of product objects.
 * @returns {string} Generated CSV string content.
 */
export function downloadProcurementCSV(products = []) {
  const safeProducts = Array.isArray(products) ? products : [];

  const headers = [
    "Product Name",
    "Category",
    "Model Number",
    "GeM Price (INR)",
    "Amazon Price (INR)",
    "Flipkart Price (INR)",
    "Lowest Platform",
    "Potential Savings per Unit (INR)",
    "Savings %",
    "Procurement Verdict",
  ];

  const rows = safeProducts.map((product) => {
    const name = product?.name || product?.title || "Untitled Product";
    const category = product?.category || "General";
    const modelNumber =
      product?.modelNumber || product?.model_number || "N/A";

    const { gem, amazon, flipkart } = extractPlatformPrices(product);

    // Identify lowest platform
    const available = [];
    if (gem !== null) available.push({ name: "GeM", price: gem });
    if (amazon !== null) available.push({ name: "Amazon", price: amazon });
    if (flipkart !== null) available.push({ name: "Flipkart", price: flipkart });

    let lowestPlatform = "N/A";
    if (available.length > 0) {
      const lowest = available.reduce((min, cur) =>
        cur.price < min.price ? cur : min
      );
      lowestPlatform = lowest.name;
    }

    // Calculate potential savings per unit and percentage
    const compPrices = [amazon, flipkart].filter((p) => p !== null);
    let potentialSavings = 0;
    let savingsPct = 0;

    if (gem !== null && compPrices.length > 0) {
      const lowestComp = Math.min(...compPrices);
      potentialSavings = Math.abs(gem - lowestComp);
      const baseline = Math.max(gem, lowestComp);
      savingsPct = baseline > 0 ? (potentialSavings / baseline) * 100 : 0;
    }

    // Determine Procurement Verdict
    let verdictText = "INSUFFICIENT_DATA";
    if (product?.verdict) {
      if (typeof product.verdict === "string") {
        verdictText = product.verdict;
      } else if (typeof product.verdict === "object") {
        verdictText =
          product.verdict.status ||
          product.verdict.recommendationText ||
          "GEM_OPTIMAL";
      }
    } else if (gem !== null && compPrices.length > 0) {
      const lowestComp = Math.min(...compPrices);
      const variance = (Math.abs(gem - lowestComp) / Math.max(gem, lowestComp)) * 100;

      if (variance > 35) {
        verdictText = "PRICE_ANOMALY";
      } else if (lowestComp < gem && ((gem - lowestComp) / gem) * 100 > 2.0) {
        verdictText = "MARKET_CHEAPER";
      } else {
        verdictText = "GEM_OPTIMAL";
      }
    } else if (gem !== null) {
      verdictText = "INSUFFICIENT_DATA";
    }

    return [
      escapeCSV(name),
      escapeCSV(category),
      escapeCSV(modelNumber),
      gem !== null ? gem.toFixed(2) : "N/A",
      amazon !== null ? amazon.toFixed(2) : "N/A",
      flipkart !== null ? flipkart.toFixed(2) : "N/A",
      escapeCSV(lowestPlatform),
      potentialSavings.toFixed(2),
      `${savingsPct.toFixed(1)}%`,
      escapeCSV(verdictText),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const filename = `GeM_Procurement_Audit_${getFormattedDate()}.csv`;

  // Progressive enhancement: Trigger native OS Save Dialog in Electron, or standard browser download on web
  if (typeof window !== "undefined" && window.electronAPI?.saveCSVFile) {
    window.electronAPI.saveCSVFile(filename, csvContent).catch((err) => {
      console.error("[Desktop OS] Failed to save CSV file via native dialog:", err);
    });
  } else if (typeof document !== "undefined" && typeof window !== "undefined") {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csvContent;
}

export default {
  downloadProcurementCSV,
};

