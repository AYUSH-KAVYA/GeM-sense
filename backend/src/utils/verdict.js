/**
 * verdict.js — Procurement Decision Engine for GeM Price Comparison.
 *
 * Compares Government e-Marketplace (GeM) pricing against external commercial
 * marketplaces (Amazon, Flipkart, etc.) and generates actionable verdicts
 * under General Financial Rules (GFR) procurement principles.
 *
 * Verdict Statuses:
 *   - GEM_OPTIMAL: GeM is the cheapest, or within 2% of the lowest competitor price.
 *   - MARKET_CHEAPER: An external commercial platform is > 2% cheaper than GeM.
 *   - PRICE_ANOMALY: The price variance between GeM and the lowest competitor exceeds 35%,
 *                    signaling a probable specification mismatch, pack-size variance, or faulty listing.
 *
 * Calculation Basis:
 *   - Price Gap / Variance: (|gemPrice - competitorPrice| / max(gemPrice, competitorPrice)) * 100.
 *     Using max(gemPrice, competitorPrice) ensures normalized variance between 0% and 100%.
 *   - Market Cheaper Savings %: ((gemPrice - lowestPrice) / gemPrice) * 100.
 *   - GeM Optimal Savings %: ((lowestMarketPrice - gemPrice) / lowestMarketPrice) * 100.
 */

/**
 * Normalizes any raw price input (number, formatted string, currency string) into a clean Float.
 * Returns null for missing, non-numeric, zero, or negative prices.
 *
 * @param {any} raw - Raw price value.
 * @returns {number|null} Clean numeric price or null if invalid.
 */
function parsePrice(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }
  if (typeof raw !== "string") return null;

  const cleaned = raw
    .replace(/[₹$]/g, "")
    .replace(/\b(INR|MRP)\b\.?/gi, "")
    .replace(/Rs\.?\s*/gi, "")
    .replace(/[,\s]/g, "")
    .replace(/\/-$/g, "")
    .replace(/^\.+/, "")
    .trim();

  const val = parseFloat(cleaned);
  return Number.isFinite(val) && val > 0 ? val : null;
}

/**
 * Normalizes heterogeneous competitor price inputs into an array of { platform: string, price: number }.
 * Supports:
 *   - Array of objects: [{ platform: 'Amazon', price: 18999 }, { name: 'Flipkart', price: 19499 }]
 *   - Keyed objects: { amazon: { price: 18999 }, flipkart: { price: 19499 } }
 *   - Direct price maps: { Amazon: 18999, Flipkart: 19499 }
 *
 * @param {any} competitorInput - Array or object containing competitor data.
 * @returns {{ platform: string, price: number }[]} Normalized list of valid competitor entries.
 */
function normalizeCompetitorPrices(competitorInput) {
  if (!competitorInput) return [];

  const validEntries = [];

  if (Array.isArray(competitorInput)) {
    for (const item of competitorInput) {
      if (!item) continue;
      const platformName = item.platform || item.name || item.source || "Market";
      const price = parsePrice(item.price ?? item.amount ?? item.cost);
      if (price !== null) {
        validEntries.push({ platform: String(platformName).trim(), price });
      }
    }
  } else if (typeof competitorInput === "object") {
    for (const [key, val] of Object.entries(competitorInput)) {
      if (!val) continue;
      // Key may be platform name or property name (e.g. amazonPrice)
      let platformName = key.replace(/price$/i, "");
      platformName = platformName.charAt(0).toUpperCase() + platformName.slice(1);

      if (typeof val === "object") {
        const nestedPlatform = val.platform || val.name || platformName;
        const price = parsePrice(val.price ?? val.amount);
        if (price !== null) {
          validEntries.push({ platform: String(nestedPlatform).trim(), price });
        }
      } else {
        const price = parsePrice(val);
        if (price !== null) {
          validEntries.push({ platform: platformName, price });
        }
      }
    }
  }

  return validEntries;
}

/**
 * Generates an authoritative government procurement verdict comparing GeM
 * against external commercial marketplaces.
 *
 * @param {number|string} gemPrice - GeM listing price.
 * @param {any} competitorPrices - Competitor price entries (array or object).
 * @returns {{
 *   status: 'GEM_OPTIMAL' | 'MARKET_CHEAPER' | 'PRICE_ANOMALY',
 *   lowestPlatform: string,
 *   lowestPrice: number,
 *   savingsAmount: number,
 *   savingsPercent: number,
 *   recommendationText: string
 * }}
 */
export function generateProcurementVerdict(gemPrice, competitorPrices) {
  const cleanGemPrice = parsePrice(gemPrice);
  const competitors = normalizeCompetitorPrices(competitorPrices);

  // ── Edge Case 1: Neither GeM nor competitor prices are available ─────────
  if (cleanGemPrice === null && competitors.length === 0) {
    return {
      status: "PRICE_ANOMALY",
      lowestPlatform: "N/A",
      lowestPrice: 0,
      savingsAmount: 0,
      savingsPercent: 0,
      recommendationText:
        "Insufficient pricing data available. GeM and competitor prices are missing or invalid.",
    };
  }

  // ── Edge Case 2: GeM price is missing, but competitor prices exist ────────
  if (cleanGemPrice === null) {
    const lowestComp = competitors.reduce((min, c) => (c.price < min.price ? c : min));
    return {
      status: "MARKET_CHEAPER",
      lowestPlatform: lowestComp.platform,
      lowestPrice: lowestComp.price,
      savingsAmount: 0,
      savingsPercent: 0,
      recommendationText: `GeM listing price unavailable. Lowest commercial market rate is ₹${lowestComp.price.toLocaleString("en-IN")} on ${lowestComp.platform}. Confirm GeM catalog rate before tender creation.`,
    };
  }

  // ── Edge Case 3: GeM price exists, but competitor prices are missing ──────
  if (competitors.length === 0) {
    return {
      status: "GEM_OPTIMAL",
      lowestPlatform: "GeM",
      lowestPrice: cleanGemPrice,
      savingsAmount: 0,
      savingsPercent: 0,
      recommendationText: `Best Rate on GeM — Approved for Direct Purchase. No external competitor listings found; listing is compliant for procurement at ₹${cleanGemPrice.toLocaleString("en-IN")}.`,
    };
  }

  // ── Multi-Platform Comparison ────────────────────────────────────────────
  // Identify the lowest competitor
  const lowestComp = competitors.reduce((min, c) => (c.price < min.price ? c : min));
  const compPrice = lowestComp.price;
  const compPlatform = lowestComp.platform;

  // Global lowest across all platforms (including GeM)
  const isGeMLowest = cleanGemPrice <= compPrice;
  const lowestPlatform = isGeMLowest ? "GeM" : compPlatform;
  const lowestPrice = isGeMLowest ? cleanGemPrice : compPrice;

  // Calculate absolute price variance relative to the higher price
  const maxPrice = Math.max(cleanGemPrice, compPrice);
  const absoluteDiff = Math.abs(cleanGemPrice - compPrice);
  const variancePercent = maxPrice > 0 ? (absoluteDiff / maxPrice) * 100 : 0;

  // ── Rule 1: PRICE_ANOMALY (> 35% Variance) ───────────────────────────────
  // A price gap exceeding 35% indicates a likely variant mismatch, bundled offer,
  // refurbished unit, or inflated government quotation.
  if (variancePercent > 35) {
    const roundedVariance = Math.round(variancePercent * 10) / 10;
    const roundedSavings = Math.round(absoluteDiff * 100) / 100;

    let recommendationText;
    if (cleanGemPrice > compPrice) {
      recommendationText = `High Price Variance — Verify Model Specs. GeM price (₹${cleanGemPrice.toLocaleString("en-IN")}) is ${roundedVariance}% higher than ${compPlatform} (₹${compPrice.toLocaleString("en-IN")}). Audit technical specifications, warranty terms, and pack quantities before committing funds.`;
    } else {
      recommendationText = `High Price Variance — Verify Model Specs. GeM price (₹${cleanGemPrice.toLocaleString("en-IN")}) is ${roundedVariance}% lower than ${compPlatform} (₹${compPrice.toLocaleString("en-IN")}). Verify supplier authenticity and fulfillment capacity before placing order.`;
    }

    return {
      status: "PRICE_ANOMALY",
      lowestPlatform,
      lowestPrice,
      savingsAmount: roundedSavings,
      savingsPercent: roundedVariance,
      recommendationText,
    };
  }

  // ── Rule 2: MARKET_CHEAPER (Competitor > 2% Cheaper than GeM) ───────────
  // Competitor offers tangible commercial savings exceeding statutory tolerance (2%).
  if (!isGeMLowest) {
    const cheaperPercent = ((cleanGemPrice - compPrice) / cleanGemPrice) * 100;

    if (cheaperPercent > 2.0) {
      const roundedPercent = Math.round(cheaperPercent * 10) / 10;
      const roundedSavings = Math.round((cleanGemPrice - compPrice) * 100) / 100;

      return {
        status: "MARKET_CHEAPER",
        lowestPlatform: compPlatform,
        lowestPrice: compPrice,
        savingsAmount: roundedSavings,
        savingsPercent: roundedPercent,
        recommendationText: `${compPlatform} is ${roundedPercent}% cheaper (₹${compPrice.toLocaleString("en-IN")} vs GeM ₹${cleanGemPrice.toLocaleString("en-IN")}). Under GFR guidelines, negotiate GeM vendor rate or record market comparison justification.`,
      };
    }
  }

  // ── Rule 3: GEM_OPTIMAL (GeM is Cheapest OR Within 2% of Lowest Market) ──
  let savingsAmount = 0;
  let savingsPercent = 0;
  let recommendationText = "";

  if (isGeMLowest) {
    const marketDiff = compPrice - cleanGemPrice;
    savingsAmount = Math.round(marketDiff * 100) / 100;
    savingsPercent = compPrice > 0 ? Math.round((marketDiff / compPrice) * 1000) / 10 : 0;

    if (savingsAmount > 0) {
      recommendationText = `Best Rate on GeM — Approved for Direct Purchase. GeM rate is ₹${cleanGemPrice.toLocaleString("en-IN")}, saving ₹${savingsAmount.toLocaleString("en-IN")} (${savingsPercent}%) compared to ${compPlatform}.`;
    } else {
      recommendationText = `Best Rate on GeM — Approved for Direct Purchase. GeM rate matches the lowest commercial market rate at ₹${cleanGemPrice.toLocaleString("en-IN")}.`;
    }
  } else {
    // GeM is higher than competitor, but within the 2% tolerance threshold
    const diff = cleanGemPrice - compPrice;
    savingsAmount = Math.round(diff * 100) / 100;
    savingsPercent = Math.round((diff / cleanGemPrice) * 1000) / 10;

    recommendationText = `Best Rate on GeM — Approved for Direct Purchase. GeM price (₹${cleanGemPrice.toLocaleString("en-IN")}) is within ${savingsPercent}% of ${compPlatform} (₹${compPrice.toLocaleString("en-IN")}), meeting direct procurement criteria.`;
  }

  return {
    status: "GEM_OPTIMAL",
    lowestPlatform: isGeMLowest ? "GeM" : compPlatform,
    lowestPrice,
    savingsAmount,
    savingsPercent,
    recommendationText,
  };
}

