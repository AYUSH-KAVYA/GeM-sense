/**
 * normalizer.js — Pure JS utility functions for data cleaning and
 * cross-marketplace product matching.
 *
 * Used by the product controller to:
 *   1. Clean raw scraped price strings into usable numbers.
 *   2. Normalize product titles for apples-to-apples comparison.
 *   3. Score how confidently two product listings match (Jaccard similarity).
 *   4. Calculate savings between GeM and competitor prices.
 */

// ── Common noise words to strip from product titles ──────────────
const NOISE_WORDS = new Set([
  "the", "a", "an", "and", "or", "with", "for", "of", "in", "on",
  "to", "by", "from", "is", "it", "at", "as", "this", "that",
  "new", "latest", "best", "top", "buy", "online", "sale", "offer",
  "pack", "combo", "set", "free", "shipping", "delivery", "warranty",
  "year", "years", "month", "months", "india", "imported", "original",
  "genuine", "certified", "brand", "branded", "product", "item",
]);

// ── 1. cleanPrice ────────────────────────────────────────────────
/**
 * Strips currency symbols (₹, $, INR), commas, whitespace, and stray
 * text from a raw price string and returns a clean Float.
 *
 * Examples:
 *   cleanPrice("₹ 43,299.00")   → 43299.00
 *   cleanPrice("INR 1,25,000")   → 125000
 *   cleanPrice("Rs. 8,499/-")    → 8499
 *   cleanPrice(52400)            → 52400
 *   cleanPrice("Out of Stock")   → null
 *
 * @param {string|number} rawPrice - The raw price value from a scraper.
 * @returns {number|null} Cleaned float price or null if unparseable.
 */
export function cleanPrice(rawPrice) {
  if (rawPrice === null || rawPrice === undefined) return null;

  // If already a valid number, return directly
  if (typeof rawPrice === "number" && !isNaN(rawPrice)) {
    return rawPrice;
  }

  if (typeof rawPrice !== "string") return null;

  // Remove currency symbols, "Rs", "INR", commas, slashes, dashes, spaces
  const cleaned = rawPrice
    .replace(/[₹$]/g, "")
    .replace(/\b(INR|MRP)\b\.?/gi, "")
    .replace(/Rs\.?\s*/gi, "")
    .replace(/[,\s]/g, "")
    .replace(/\/-$/g, "")
    .replace(/^\.+/, "")
    .trim();

  const value = parseFloat(cleaned);
  return isNaN(value) || value < 0 ? null : value;
}

// ── 2. normalizeTitle ────────────────────────────────────────────
/**
 * Normalizes a product title for comparison by:
 *   - Lowercasing
 *   - Stripping special characters (keeping alphanumeric + spaces)
 *   - Removing noise/filler words
 *   - Extracting meaningful tokens (brand names, model numbers)
 *
 * @param {string} title - Raw product title from any platform.
 * @returns {{ normalized: string, tokens: string[] }}
 *   normalized — cleaned single string for display
 *   tokens     — deduplicated word array for similarity scoring
 */
export function normalizeTitle(title) {
  if (!title || typeof title !== "string") {
    return { normalized: "", tokens: [] };
  }

  // Lowercase and strip non-alphanumeric (keep dots for model numbers)
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Tokenize and filter noise words
  const tokens = cleaned
    .split(" ")
    .filter((word) => word.length > 0 && !NOISE_WORDS.has(word));

  // Deduplicate while preserving order
  const seen = new Set();
  const uniqueTokens = [];
  for (const token of tokens) {
    if (!seen.has(token)) {
      seen.add(token);
      uniqueTokens.push(token);
    }
  }

  return {
    normalized: uniqueTokens.join(" "),
    tokens: uniqueTokens,
  };
}

// ── 3. calculateMatchConfidence ──────────────────────────────────
/**
 * Calculates a 0–100 confidence score for how likely two product
 * listings refer to the same physical product.
 *
 * Uses weighted Jaccard similarity with a bonus for matching
 * model-number-like tokens (e.g., "mfp4104dw", "5540", "l3250").
 *
 * @param {string} gemTitle        - Product title from GeM.
 * @param {string} competitorTitle - Product title from Amazon/Flipkart.
 * @returns {number} Confidence score 0–100 (integer).
 */
export function calculateMatchConfidence(gemTitle, competitorTitle) {
  const { tokens: gemTokens } = normalizeTitle(gemTitle);
  const { tokens: compTokens } = normalizeTitle(competitorTitle);

  if (gemTokens.length === 0 || compTokens.length === 0) return 0;

  const gemSet = new Set(gemTokens);
  const compSet = new Set(compTokens);

  // Jaccard intersection & union
  let intersection = 0;
  for (const token of gemSet) {
    if (compSet.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...gemTokens, ...compTokens]).size;
  if (union === 0) return 0;

  const jaccardScore = intersection / union;

  // Bonus: model-number-like tokens (contain both letters and digits)
  const MODEL_PATTERN = /^(?=.*[a-z])(?=.*\d)[a-z0-9.]+$/;
  let modelBonus = 0;
  let modelCount = 0;

  for (const token of gemSet) {
    if (MODEL_PATTERN.test(token)) {
      modelCount++;
      if (compSet.has(token)) {
        modelBonus += 0.15; // each shared model token adds 15%
      }
    }
  }

  // Combine: base Jaccard (weighted 0.7) + model bonus (capped at 0.3)
  const rawScore = jaccardScore * 0.7 + Math.min(modelBonus, 0.3);

  // Scale to 0–100 and clamp
  return Math.min(100, Math.max(0, Math.round(rawScore * 100)));
}

// ── 4. calculateSavings ──────────────────────────────────────────
/**
 * Given the GeM price and an array of competitor price objects,
 * returns the savings analysis.
 *
 * @param {number} gemPrice - The product price on GeM.
 * @param {{ platform: string, price: number }[]} competitorPrices
 *   Array of competitor prices, each with platform name and price.
 * @returns {{
 *   cheapestPlatform: string,
 *   cheapestPrice: number,
 *   gemPrice: number,
 *   absoluteSaving: number,
 *   percentSaving: number,
 *   isGeMCheapest: boolean,
 *   verdict: string
 * }}
 */
export function calculateSavings(gemPrice, competitorPrices = []) {
  if (!gemPrice || gemPrice <= 0 || competitorPrices.length === 0) {
    return {
      cheapestPlatform: "GeM",
      cheapestPrice: gemPrice || 0,
      gemPrice: gemPrice || 0,
      absoluteSaving: 0,
      percentSaving: 0,
      isGeMCheapest: true,
      verdict: "No competitor data available",
    };
  }

  // Filter out invalid prices
  const validCompetitors = competitorPrices.filter(
    (c) => c && typeof c.price === "number" && c.price > 0
  );

  if (validCompetitors.length === 0) {
    return {
      cheapestPlatform: "GeM",
      cheapestPrice: gemPrice,
      gemPrice,
      absoluteSaving: 0,
      percentSaving: 0,
      isGeMCheapest: true,
      verdict: "No valid competitor prices to compare",
    };
  }

  // Find the cheapest competitor
  const cheapestCompetitor = validCompetitors.reduce((min, curr) =>
    curr.price < min.price ? curr : min
  );

  // All candidates including GeM
  const allPrices = [
    { platform: "GeM", price: gemPrice },
    ...validCompetitors,
  ];
  const overallCheapest = allPrices.reduce((min, curr) =>
    curr.price < min.price ? curr : min
  );

  const isGeMCheapest = overallCheapest.platform === "GeM";

  // Savings relative to the most expensive alternative
  const mostExpensive = allPrices.reduce((max, curr) =>
    curr.price > max.price ? curr : max
  );

  const absoluteSaving = mostExpensive.price - overallCheapest.price;
  const percentSaving =
    mostExpensive.price > 0
      ? Math.round((absoluteSaving / mostExpensive.price) * 100)
      : 0;

  // Generate a human-readable verdict
  let verdict;
  if (isGeMCheapest && percentSaving >= 10) {
    verdict = `GeM is the best deal — ${percentSaving}% cheaper than ${mostExpensive.platform}`;
  } else if (isGeMCheapest) {
    verdict = `GeM is cheapest, but only marginally (${percentSaving}% less)`;
  } else {
    const gemVsCheapest = gemPrice - overallCheapest.price;
    const gemOverpayPercent =
      overallCheapest.price > 0
        ? Math.round((gemVsCheapest / overallCheapest.price) * 100)
        : 0;
    verdict = `${overallCheapest.platform} is ${gemOverpayPercent}% cheaper than GeM — review procurement justification`;
  }

  return {
    cheapestPlatform: overallCheapest.platform,
    cheapestPrice: overallCheapest.price,
    gemPrice,
    absoluteSaving,
    percentSaving,
    isGeMCheapest,
    verdict,
  };
}
