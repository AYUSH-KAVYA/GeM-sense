/**
 * normalizer.js — Pure JS utility functions for data cleaning, specification extraction,
 * and cross-marketplace product matching.
 *
 * Used by the product controller to:
 *   1. Clean raw scraped price strings into usable numbers.
 *   2. Normalize product titles for apples-to-apples comparison.
 *   3. Extract technical specifications (RAM, storage, processor, screen size, etc.).
 *   4. Score how confidently two product listings match (Token Jaccard + Spec matching).
 *   5. Calculate savings between GeM and competitor prices.
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

// ── 3. extractSpecs ──────────────────────────────────────────────
/**
 * Extracts important product specifications using regular expressions.
 *
 * Supported specs:
 *   - RAM: 4GB, 8GB, 16GB, 32GB, 64GB, etc.
 *   - Storage: 256GB SSD, 512GB SSD, 1TB HDD, etc.
 *   - Processor: Intel i3, i5, i7, i9, Ryzen 5, Ryzen 7, Apple M1/M2/M3, etc.
 *   - Screen size: 14 inch, 15.6 inch, 17 inch, etc.
 *   - Weight and Capacity: 1.5 Ton AC, 1100VA UPS, 1.5 kg, etc.
 *   - Printer & Office Equipment: Laser / Ink Tank, All-in-One / MFP, Wireless, Duplex, Mono / Color.
 *
 * @param {string} title - Product title string.
 * @returns {object} Structured JavaScript object containing extracted specifications.
 */
export function extractSpecs(title) {
  const emptySpecs = {
    raw: typeof title === "string" ? title : "",
    ram: null,
    ramGb: null,
    storage: null,
    storageGb: null,
    storageType: null,
    processor: null,
    processorTier: null,
    screenSize: null,
    screenSizeInches: null,
    capacity: null,
    weight: null,
    printerType: null,
    printerFunction: null,
    printerConnectivity: null,
    printerDuplex: null,
    printerColor: null,
    printer: {
      type: null,
      function: null,
      connectivity: null,
      duplex: null,
      color: null,
    },
  };

  if (!title || typeof title !== "string") {
    return emptySpecs;
  }

  const text = title.trim();

  // ── RAM Extraction ─────────────────────────────────────────────
  let ram = null;
  let ramGb = null;

  // 1. Explicit RAM patterns: e.g. "16GB RAM", "16 GB DDR4", "8GB unified memory", "32GB Memory"
  const explicitRamMatch = text.match(
    /\b(\d{1,3})\s*(?:GB|MB)\s*(?:RAM|DDR\d*|LPDDR\d*|Memory|Unified\s*Memory)\b/i
  ) || text.match(/\b(?:RAM|Memory)\s*[:=]?\s*(\d{1,3})\s*(?:GB|MB)\b/i);

  if (explicitRamMatch) {
    ramGb = parseInt(explicitRamMatch[1], 10);
    ram = `${ramGb}GB`;
  }

  // ── Storage Extraction ─────────────────────────────────────────
  let storage = null;
  let storageGb = null;
  let storageType = null;

  // 1. Explicit Storage with SSD/HDD/NVMe/eMMC/ROM/Drive:
  // e.g. "512GB SSD", "1TB HDD", "256 GB NVMe SSD", "1 TB PCIe SSD", "128GB eMMC"
  const explicitStorageMatch = text.match(
    /\b(\d{1,4})\s*(GB|TB)\s*(?:NVMe(?:\s*M\.2)?\s*|PCIe\s*)?(SSD|HDD|eMMC|ROM|Hard\s*Drive|Hard\s*Disk)\b/i
  );

  if (explicitStorageMatch) {
    const rawVal = parseInt(explicitStorageMatch[1], 10);
    const unit = explicitStorageMatch[2].toUpperCase();
    storageType = explicitStorageMatch[3].toUpperCase().includes("SSD")
      ? "SSD"
      : explicitStorageMatch[3].toUpperCase().includes("HDD") || explicitStorageMatch[3].toUpperCase().includes("HARD")
      ? "HDD"
      : explicitStorageMatch[3].toUpperCase();
    storageGb = unit === "TB" ? rawVal * 1024 : rawVal;
    storage = `${rawVal}${unit} ${storageType}`;
  }

  // 2. TB storage without explicit SSD/HDD: e.g. "1TB" or "2 TB"
  if (!storage) {
    const tbMatch = text.match(/\b([1248])\s*TB\b/i);
    if (tbMatch) {
      const tbVal = parseInt(tbMatch[1], 10);
      storageGb = tbVal * 1024;
      storage = `${tbVal}TB`;
      storageType = text.match(/\bSSD\b/i) ? "SSD" : text.match(/\bHDD\b/i) ? "HDD" : null;
      if (storageType) storage += ` ${storageType}`;
    }
  }

  // 3. Fallback for pair notation: e.g. "16GB/512GB", "16GB, 512GB SSD", "8GB + 256GB"
  if (!ram || !storage) {
    const sizeMatches = Array.from(text.matchAll(/\b(\d{1,4})\s*(GB|TB)\b/gi));
    const sizes = sizeMatches
      .map((m) => {
        const val = parseInt(m[1], 10);
        const unit = m[2].toUpperCase();
        const gb = unit === "TB" ? val * 1024 : val;
        const index = m.index;
        const afterText = text.slice(index, index + 25);
        const isStorageContext = /SSD|HDD|NVMe|eMMC|Storage|Hard/i.test(afterText);
        const isRamContext = /RAM|DDR|Memory/i.test(afterText);
        return { val, unit, gb, index, isStorageContext, isRamContext, raw: `${val}${unit}` };
      })
      // Exclude AC tonnage or other non-memory matches
      .filter((s) => s.val > 0 && s.gb <= 8192);

    if (!ram) {
      const ramCandidate = sizes.find((s) => s.isRamContext || (s.gb <= 64 && !s.isStorageContext));
      if (ramCandidate) {
        ramGb = ramCandidate.gb;
        ram = `${ramCandidate.val}${ramCandidate.unit}`;
      }
    }

    if (!storage) {
      const storageCandidate = sizes.find(
        (s) => s.isStorageContext || (s.gb >= 128 && (!ramCandidate || s.index !== ramCandidate.index))
      );
      if (storageCandidate) {
        storageGb = storageCandidate.gb;
        storage = `${storageCandidate.val}${storageCandidate.unit}`;
        if (text.match(/\bSSD\b/i)) {
          storageType = "SSD";
          storage += " SSD";
        } else if (text.match(/\bHDD\b/i)) {
          storageType = "HDD";
          storage += " HDD";
        }
      }
    }
  }

  // ── Processor Extraction ─────────────────────────────────────────
  let processor = null;
  let processorTier = null;

  // Intel: Core i3, i5, i7, i9, Core Ultra, Celeron, Pentium
  const intelMatch = text.match(
    /\b(?:Intel(?:\s+Core)?)?\s*(i[3579]|Core\s+Ultra\s+[579]|Celeron|Pentium)(?:[-\s]?(\d{4,5}[A-Z\d]*))?(?:\s+(\d{1,2}(?:th|nd|rd|st)\s*(?:Gen(?:eration)?)?))?/i
  );

  // AMD Ryzen: Ryzen 3, 5, 7, 9, Athlon
  const amdMatch = text.match(
    /\b(?:AMD\s+)?(Ryzen\s+[3579]|Athlon)(?:\s+(?:Pro\s+)?(\d{4}[A-Z\d]*))?/i
  );

  // Apple Silicon: M1, M2, M3, M4 (Base, Pro, Max, Ultra)
  const appleMatch = text.match(/\b(?:Apple\s+)?(M[1234](?:\s+(?:Pro|Max|Ultra))?)(?:\s+chip)?\b/i);

  if (intelMatch && intelMatch[1]) {
    const rawSeries = intelMatch[1];
    const series = rawSeries.startsWith("i") || rawSeries.startsWith("I")
      ? `i${rawSeries.slice(1)}`
      : rawSeries;
    processorTier = series.toLowerCase();
    const model = intelMatch[2] ? intelMatch[2].toUpperCase() : "";
    const gen = intelMatch[3] ? intelMatch[3].trim() : "";
    processor = `Intel Core ${series}${model ? `-${model}` : ""}${gen ? ` ${gen}` : ""}`.trim();
  } else if (amdMatch && amdMatch[1]) {
    const series = amdMatch[1].replace(/\s+/g, " ");
    processorTier = series.toLowerCase();
    const model = amdMatch[2] ? amdMatch[2] : "";
    processor = `AMD ${series}${model ? ` ${model}` : ""}`.trim();
  } else if (appleMatch && appleMatch[1]) {
    processor = `Apple ${appleMatch[1].trim()}`;
    processorTier = appleMatch[1].toLowerCase();
  }

  // ── Screen Size Extraction ───────────────────────────────────────
  let screenSize = null;
  let screenSizeInches = null;

  const screenMatch = text.match(
    /\b(1[1-9](?:\.\d{1,2})?|2[0-9](?:\.\d{1,2})?|3[0-2](?:\.\d{1,2})?)\s*(?:inch(?:es)?|["”]|''|-inch)\b/i
  );

  if (screenMatch) {
    screenSizeInches = parseFloat(screenMatch[1]);
    screenSize = `${screenSizeInches} inch`;
  }

  // ── Capacity Extraction (AC, UPS, Power) ─────────────────────────
  let capacity = null;

  // Air conditioner tonnage: e.g. "1.5 Ton", "1 Ton", "2 Ton", "0.8 Ton"
  const acMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:Ton(?:ne)?s?|TR)\b/i);
  if (acMatch) {
    capacity = `${acMatch[1]} Ton`;
  }

  // UPS capacity: e.g. "1100VA", "650VA", "1kVA", "2 kVA"
  const upsMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(k?VA)\b/i);
  if (upsMatch && !capacity) {
    capacity = `${upsMatch[1]}${upsMatch[2].toUpperCase()}`;
  }

  // ── Weight Extraction ────────────────────────────────────────────
  let weight = null;
  const weightKgMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms?)\b/i);
  const weightGMatch = text.match(/\b(\d{2,4})\s*(?:g|grams)\b/i);

  if (weightKgMatch) {
    weight = `${weightKgMatch[1]} kg`;
  } else if (weightGMatch) {
    weight = `${weightGMatch[1]} g`;
  }

  // ── Printer & Office Equipment Specs ─────────────────────────────
  let printerType = null;
  if (/\b(laserjet|laser)\b/i.test(text)) {
    printerType = "Laser";
  } else if (/\b(ink\s*tank|ecotank|smart\s*tank)\b/i.test(text)) {
    printerType = "Ink Tank";
  } else if (/\b(inkjet|deskjet)\b/i.test(text)) {
    printerType = "Inkjet";
  } else if (/\b(dot\s*matrix)\b/i.test(text)) {
    printerType = "Dot Matrix";
  } else if (/\bthermal\b/i.test(text)) {
    printerType = "Thermal";
  }

  let printerFunction = null;
  if (/\b(all\s*in\s*one|all-in-one|mfp|multi\s*function|multifunction|print[\s,]+scan[\s,]+copy|3-in-1)\b/i.test(text)) {
    printerFunction = "All-in-One";
  } else if (/\bsingle\s*function\b/i.test(text)) {
    printerFunction = "Single Function";
  }

  let printerConnectivity = null;
  if (/\b(wi-?fi|wireless)\b/i.test(text)) {
    printerConnectivity = "Wireless";
  } else if (/\b(ethernet|lan|network)\b/i.test(text)) {
    printerConnectivity = "Ethernet";
  } else if (/\busb\b/i.test(text)) {
    printerConnectivity = "USB";
  }

  let printerDuplex = null;
  if (/\b(auto[- ]?duplex|duplex|two[- ]sided\s*print(?:ing)?|\b\w*d[nw]\b)/i.test(text)) {
    printerDuplex = true;
  }

  let printerColor = null;
  if (/\b(monochrome|mono|black\s*(?:&|and)\s*white|b\/w)\b/i.test(text)) {
    printerColor = "Monochrome";
  } else if (/\b(colou?r)\b/i.test(text) && !/\b(off[- ]?white|grey|gray|black)\b/i.test(text)) {
    printerColor = "Color";
  } else if (printerType === "Laser") {
    // Standard laser printers default to Monochrome unless explicitly Color
    printerColor = "Monochrome";
  } else if (printerType === "Ink Tank" || printerType === "Inkjet") {
    // Consumer ink tank & inkjet printers default to Color
    printerColor = "Color";
  }

  const printer = {
    type: printerType,
    function: printerFunction,
    connectivity: printerConnectivity,
    duplex: printerDuplex,
    color: printerColor,
  };

  return {
    raw: text,
    ram,
    ramGb,
    storage,
    storageGb,
    storageType,
    processor,
    processorTier,
    screenSize,
    screenSizeInches,
    capacity,
    weight,
    printerType,
    printerFunction,
    printerConnectivity,
    printerDuplex,
    printerColor,
    printer,
  };
}

// ── 4. calculateMatchConfidence ──────────────────────────────────
/**
 * Calculates a 0–100 confidence score for how likely two product
 * listings refer to the same physical product.
 *
 * Matching algorithm:
 *   - Token Jaccard similarity: 60% weight.
 *   - Specification matching: 40% weight.
 *
 * Identifies mismatched specifications (e.g., RAM, storage capacities, processor tier)
 * and ensures missing specs are not automatically treated as confirmed matches.
 *
 * @param {string} gemTitle        - Product title from GeM.
 * @param {string} competitorTitle - Product title from Amazon/Flipkart.
 * @returns {{
 *   score: number,
 *   isExactSpecMatch: boolean,
 *   mismatchedSpecs: string[]
 * }}
 */
export function calculateMatchConfidence(gemTitle, competitorTitle) {
  // Safe handling of null, undefined, or empty titles
  if (
    !gemTitle ||
    !competitorTitle ||
    typeof gemTitle !== "string" ||
    typeof competitorTitle !== "string" ||
    !gemTitle.trim() ||
    !competitorTitle.trim()
  ) {
    return {
      score: 0,
      isExactSpecMatch: false,
      mismatchedSpecs: [],
      valueOf() {
        return this.score;
      },
    };
  }

  // ── Part 1: Token Jaccard Similarity (60% weight) ───────────────
  const { tokens: gemTokens } = normalizeTitle(gemTitle);
  const { tokens: compTokens } = normalizeTitle(competitorTitle);

  let jaccardScore = 0;
  if (gemTokens.length > 0 && compTokens.length > 0) {
    const gemSet = new Set(gemTokens);
    const compSet = new Set(compTokens);

    let intersection = 0;
    for (const token of gemSet) {
      if (compSet.has(token)) {
        intersection++;
      }
    }

    const union = new Set([...gemTokens, ...compTokens]).size;
    jaccardScore = union > 0 ? intersection / union : 0;
  }

  // ── Part 2: Specification Matching (40% weight) ────────────────
  const gemSpecs = extractSpecs(gemTitle);
  const compSpecs = extractSpecs(competitorTitle);

  const mismatchedSpecs = [];
  let evaluatedDimensions = 0;
  let matchingDimensions = 0;
  let partialDimensions = 0;
  let hasMissingSpec = false;

  // 1. RAM Comparison
  if (gemSpecs.ramGb || compSpecs.ramGb) {
    evaluatedDimensions++;
    if (gemSpecs.ramGb && compSpecs.ramGb) {
      if (gemSpecs.ramGb === compSpecs.ramGb) {
        matchingDimensions++;
      } else {
        mismatchedSpecs.push("RAM");
      }
    } else {
      hasMissingSpec = true;
      partialDimensions++;
    }
  }

  // 2. Storage Comparison
  if (gemSpecs.storageGb || compSpecs.storageGb) {
    evaluatedDimensions++;
    if (gemSpecs.storageGb && compSpecs.storageGb) {
      const capacitiesMatch = gemSpecs.storageGb === compSpecs.storageGb;
      const typesMatch =
        !gemSpecs.storageType ||
        !compSpecs.storageType ||
        gemSpecs.storageType === compSpecs.storageType;

      if (capacitiesMatch && typesMatch) {
        matchingDimensions++;
      } else {
        mismatchedSpecs.push("Storage");
      }
    } else {
      hasMissingSpec = true;
      partialDimensions++;
    }
  }

  // 3. Processor Tier Comparison
  if (gemSpecs.processorTier || compSpecs.processorTier) {
    evaluatedDimensions++;
    if (gemSpecs.processorTier && compSpecs.processorTier) {
      if (gemSpecs.processorTier === compSpecs.processorTier) {
        matchingDimensions++;
      } else {
        mismatchedSpecs.push("Processor");
      }
    } else {
      hasMissingSpec = true;
      partialDimensions++;
    }
  }

  // 4. Screen Size Comparison
  if (gemSpecs.screenSizeInches || compSpecs.screenSizeInches) {
    evaluatedDimensions++;
    if (gemSpecs.screenSizeInches && compSpecs.screenSizeInches) {
      const diff = Math.abs(gemSpecs.screenSizeInches - compSpecs.screenSizeInches);
      if (diff <= 0.4) {
        matchingDimensions++;
      } else {
        mismatchedSpecs.push("Screen Size");
      }
    } else {
      hasMissingSpec = true;
      partialDimensions++;
    }
  }

  // 5. Capacity Comparison (AC tonnage, UPS VA)
  if (gemSpecs.capacity || compSpecs.capacity) {
    evaluatedDimensions++;
    if (gemSpecs.capacity && compSpecs.capacity) {
      if (gemSpecs.capacity.toLowerCase() === compSpecs.capacity.toLowerCase()) {
        matchingDimensions++;
      } else {
        mismatchedSpecs.push("Capacity");
      }
    } else {
      hasMissingSpec = true;
      partialDimensions++;
    }
  }

  // 6. Printer Type Comparison
  if (gemSpecs.printerType || compSpecs.printerType) {
    evaluatedDimensions++;
    if (gemSpecs.printerType && compSpecs.printerType) {
      if (gemSpecs.printerType.toLowerCase() === compSpecs.printerType.toLowerCase()) {
        matchingDimensions++;
      } else {
        mismatchedSpecs.push("Printer Type");
      }
    } else {
      hasMissingSpec = true;
      partialDimensions++;
    }
  }

  // 7. Printer Color Comparison
  if (gemSpecs.printerColor || compSpecs.printerColor) {
    evaluatedDimensions++;
    if (gemSpecs.printerColor && compSpecs.printerColor) {
      if (gemSpecs.printerColor.toLowerCase() === compSpecs.printerColor.toLowerCase()) {
        matchingDimensions++;
      } else {
        mismatchedSpecs.push("Color Output");
      }
    } else {
      hasMissingSpec = true;
      partialDimensions++;
    }
  }

  // ── Compute Spec Score & Exact Spec Match ──────────────────────
  let specScore;
  let isExactSpecMatch = false;

  if (evaluatedDimensions === 0) {
    // When no hardware specs apply (e.g. furniture, stationery),
    // similarity is driven by token Jaccard similarity.
    specScore = jaccardScore;
    isExactSpecMatch = false;
  } else {
    // Missing specs receive partial weight (0.5) to avoid treating them as confirmed matches.
    // Mismatches receive 0.0.
    const specQuality = (matchingDimensions + partialDimensions * 0.5) / evaluatedDimensions;

    // Apply strict penalty if critical hardware specifications directly conflict
    const penalty = mismatchedSpecs.length * 0.25;
    specScore = Math.max(0, specQuality - penalty);

    // Exact spec match requires:
    // - At least one matching spec
    // - Zero mismatched specs
    // - Neither listing is missing any of the evaluated specs
    isExactSpecMatch =
      matchingDimensions > 0 &&
      mismatchedSpecs.length === 0 &&
      !hasMissingSpec;
  }

  // ── Combine: 60% Token Jaccard + 40% Spec Score ────────────────
  const rawScore = jaccardScore * 60 + specScore * 40;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    score,
    isExactSpecMatch,
    mismatchedSpecs,
    valueOf() {
      return this.score;
    },
  };
}

// ── 5. calculateSavings ──────────────────────────────────────────
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
