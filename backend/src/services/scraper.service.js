import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Scraper Service — Platform-specific product scrapers for GeM, Amazon, and Flipkart.
 *
 * Uses rotating User-Agent headers, request timeouts, Cheerio HTML parsing,
 * and a deterministic fallback generator so blocked/timed-out requests never crash the server.
 */

const DEFAULT_TIMEOUT_MS = 6000;

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
];

const KNOWN_BRANDS = [
  "HP",
  "Dell",
  "Lenovo",
  "Canon",
  "Epson",
  "Brother",
  "Godrej",
  "Daikin",
  "LG",
  "Samsung",
  "BenQ",
  "APC",
  "Logitech",
  "Asus",
  "Acer",
  "Cisco",
  "Voltas",
  "Blue Star",
];

const CATEGORY_HINTS = [
  { keywords: ["laptop", "macbook", "notebook", "thinkpad", "latitude"], category: "Laptops & Desktops", minPrice: 38000, maxPrice: 95000 },
  { keywords: ["desktop", "optiplex", "workstation", "pc"], category: "Laptops & Desktops", minPrice: 32000, maxPrice: 78000 },
  { keywords: ["printer", "laserjet", "ecotank", "imageclass", "scanner"], category: "Printers & Scanners", minPrice: 11000, maxPrice: 48000 },
  { keywords: ["chair", "desk", "table", "furniture", "almirah"], category: "Office Furniture", minPrice: 6500, maxPrice: 24000 },
  { keywords: ["ac", "air conditioner", "split ac", "inverter"], category: "Air Conditioners", minPrice: 29000, maxPrice: 58000 },
  { keywords: ["projector", "display", "monitor", "tv"], category: "Projectors & Displays", minPrice: 12000, maxPrice: 65000 },
  { keywords: ["ups", "inverter", "battery", "power"], category: "UPS & Power", minPrice: 3500, maxPrice: 18000 },
  { keywords: ["keyboard", "mouse", "webcam", "headset"], category: "Stationery & Supplies", minPrice: 900, maxPrice: 6500 },
];

/**
 * Pick a rotating User-Agent header.
 * @param {number} [seed] - Optional deterministic index
 * @returns {string} User-Agent string
 */
export function getRandomUserAgent(seed) {
  if (typeof seed === "number") {
    return USER_AGENTS[Math.abs(seed) % USER_AGENTS.length];
  }
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Build realistic browser-like HTTP headers with rotating User-Agent.
 * @param {string} [referer] - Optional Referer URL
 * @returns {object} HTTP headers object
 */
function buildRequestHeaders(referer) {
  return {
    "User-Agent": getRandomUserAgent(),
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    ...(referer ? { Referer: referer } : {}),
  };
}

/**
 * Fetch HTML with timeout and bot-block detection.
 * @param {string} url - Target URL
 * @param {object} [options]
 * @param {number} [options.timeoutMs]
 * @param {string} [options.referer]
 * @returns {Promise<string>} Raw HTML body
 */
async function fetchHtml(url, { timeoutMs = DEFAULT_TIMEOUT_MS, referer } = {}) {
  const response = await axios.get(url, {
    headers: buildRequestHeaders(referer),
    timeout: timeoutMs,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const html = typeof response.data === "string" ? response.data : "";
  if (!html) {
    throw new Error("Empty HTML response");
  }

  // Detect common CAPTCHA / anti-bot interstitial pages
  const lower = html.toLowerCase();
  if (
    lower.includes("validatecaptcha") ||
    lower.includes("enter the characters you see below") ||
    lower.includes("sorry, we just need to make sure you're not a robot") ||
    lower.includes("access denied") ||
    lower.includes("cf-challenge")
  ) {
    throw new Error("Blocked by anti-bot / CAPTCHA challenge");
  }

  return html;
}

/**
 * Parse a numeric price from raw currency text.
 * @param {string} rawText
 * @returns {number|null}
 */
function parseRawPrice(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  const cleaned = rawText
    .replace(/[₹$,\s]/g, "")
    .replace(/\b(INR|Rs\.?|MRP\.?)\b/gi, "")
    .trim();
  const match = cleaned.match(/\d+(\.\d+)?/);
  if (!match) return null;
  const val = parseFloat(match[0]);
  return Number.isFinite(val) && val > 0 ? val : null;
}

/**
 * Parse a numeric rating (0-5) from rating text like "4.3 out of 5 stars".
 * @param {string} rawText
 * @returns {number|null}
 */
function parseRating(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  const match = rawText.match(/([0-4](\.\d+)?|5(\.0+)?)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return Number.isFinite(val) && val >= 0 && val <= 5 ? +val.toFixed(1) : null;
}

/**
 * Deterministic 32-bit FNV-1a hash so fallback pricing is reproducible per query.
 * @param {string} input
 * @returns {number} Unsigned 32-bit integer
 */
function hashQuery(input) {
  let hash = 2166136261;
  const str = String(input || "").toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Extract brand, model number, category, and deterministic base price from a query.
 * @param {string} query
 */
function inferMetadataFromQuery(query) {
  const cleanQuery = String(query || "Office Equipment").trim();
  const lower = cleanQuery.toLowerCase();

  // Handle direct GeM URL queries gracefully
  let displayQuery = cleanQuery;
  if (/^https?:\/\//i.test(cleanQuery)) {
    const slugMatch = cleanQuery.match(/\/([^/]+)\/p-\d+/i) || cleanQuery.match(/\/([^/?#]+)(?:[?#]|$)/);
    displayQuery = slugMatch
      ? slugMatch[1].replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "GeM Catalog Product";
  }

  const normalizedDisplay = displayQuery.toLowerCase();
  const brand =
    KNOWN_BRANDS.find((b) => normalizedDisplay.includes(b.toLowerCase())) || null;

  // Look for model-like alphanumeric tokens (e.g., 5540, MFP4104dw, L3250)
  const modelMatch = displayQuery.match(/\b(?=[A-Za-z0-9-]*\d)[A-Za-z0-9-]{3,16}\b/);
  const modelNumber = modelMatch ? modelMatch[0] : null;

  const hint = CATEGORY_HINTS.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw) || normalizedDisplay.includes(kw))
  ) || {
    category: "Office & IT Equipment",
    minPrice: 8000,
    maxPrice: 35000,
  };

  const h = hashQuery(displayQuery);
  const spread = hint.maxPrice - hint.minPrice;
  const basePrice = Math.round((hint.minPrice + (h % spread)) / 100) * 100;

  return {
    displayTitle: displayQuery,
    brand,
    modelNumber,
    category: hint.category,
    basePrice,
    hash: h,
  };
}

/**
 * Deterministic demo fallback generator when live scraping is blocked or fails.
 * @param {"GeM"|"Amazon"|"Flipkart"} platform
 * @param {string} query
 * @param {string} reason
 * @returns {object} Structured product result
 */
function generateFallbackResult(platform, query, reason) {
  const meta = inferMetadataFromQuery(query);
  const encodedQuery = encodeURIComponent(meta.displayTitle);

  // Platform-specific deterministic multipliers & URLs
  let priceMultiplier = 1;
  let productUrl = "";
  let rating = 4.2;
  let inStock = true;

  if (platform === "GeM") {
    // GeM is typically competitive, with slight deterministic variance
    priceMultiplier = 0.92 + ((meta.hash % 15) / 100); // 0.92x – 1.06x
    productUrl = /^https?:\/\/(mkp\.)?gem\.gov\.in/i.test(query)
      ? query.trim()
      : `https://mkp.gem.gov.in/search?q=${encodedQuery}`;
    rating = +(3.8 + ((meta.hash % 11) / 10)).toFixed(1);
    inStock = true;
  } else if (platform === "Amazon") {
    priceMultiplier = 0.98 + (((meta.hash >> 4) % 18) / 100); // 0.98x – 1.15x
    productUrl = `https://www.amazon.in/s?k=${encodedQuery}`;
    rating = +(3.9 + (((meta.hash >> 3) % 10) / 10)).toFixed(1);
    inStock = (meta.hash % 10) !== 0;
  } else {
    priceMultiplier = 0.97 + (((meta.hash >> 8) % 20) / 100); // 0.97x – 1.16x
    productUrl = `https://www.flipkart.com/search?q=${encodedQuery}`;
    rating = +(3.8 + (((meta.hash >> 5) % 11) / 10)).toFixed(1);
    inStock = (meta.hash % 12) !== 0;
  }

  const price = Math.round((meta.basePrice * priceMultiplier) / 10) * 10;
  const title = `${meta.displayTitle}`;

  console.warn(
    `[Scraper Fallback] ${platform} using deterministic fallback for "${query}" (${reason})`
  );

  return {
    platform,
    title,
    name: title,
    category: meta.category,
    brand: meta.brand,
    modelNumber: meta.modelNumber,
    price,
    productUrl,
    imageUrl: null,
    inStock,
    rating: Math.min(5, Math.max(1, rating)),
    isFallback: true,
  };
}

/**
 * Scrape product details from the GeM portal (search results or direct product page).
 * @param {string} query - Product keyword or GeM product URL
 * @returns {Promise<object>} Scraped or fallback product data
 */
export async function scrapeGemProduct(query) {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) {
    return generateFallbackResult("GeM", "Office Equipment", "Empty query");
  }

  const isDirectUrl = /^https?:\/\/(mkp\.)?gem\.gov\.in/i.test(cleanQuery);
  const targetUrl = isDirectUrl
    ? cleanQuery
    : `https://mkp.gem.gov.in/search?q=${encodeURIComponent(cleanQuery)}`;

  try {
    const html = await fetchHtml(targetUrl, {
      referer: "https://mkp.gem.gov.in/",
    });
    const $ = cheerio.load(html);
    const meta = inferMetadataFromQuery(cleanQuery);

    let title = null;
    let price = null;
    let brand = null;
    let modelNumber = null;
    let imageUrl = null;
    let productUrl = targetUrl;
    let inStock = true;

    if (isDirectUrl) {
      title =
        $("#product-title, .pdp-product-title, h1").first().text().trim() || null;
      price = parseRawPrice(
        $(".m-w-price, .variant-final-price, .pdp-price").first().text()
      );
      brand = $(".pdp-brand, .brand-name").first().text().trim() || meta.brand;
      modelNumber =
        $(".pdp-model, .model-number").first().text().trim() || meta.modelNumber;
      imageUrl =
        $(".pdp-image img, #product-image img").first().attr("src") || null;
      const bodyText = $("body").text().toLowerCase();
      inStock = !bodyText.includes("out of stock");
    } else {
      const card = $(".variant-wrapper, .product-item, .search-result-item").first();
      if (card.length) {
        title =
          card.find(".variant-title, .product-title, h2, h3").first().text().trim() ||
          null;
        price = parseRawPrice(
          card.find(".variant-final-price, .m-w-price, .price").first().text()
        );
        brand = card.find(".brand-name").first().text().trim() || meta.brand;
        modelNumber =
          card.find(".model-number").first().text().trim() || meta.modelNumber;
        imageUrl = card.find("img").first().attr("src") || null;
        const href = card.find("a").first().attr("href");
        if (href) {
          productUrl = href.startsWith("http")
            ? href
            : `https://mkp.gem.gov.in${href.startsWith("/") ? "" : "/"}${href}`;
        }
        inStock = !card.text().toLowerCase().includes("out of stock");
      }
    }

    if (!title || !price) {
      throw new Error("Could not parse GeM title or price from HTML");
    }

    return {
      platform: "GeM",
      title,
      name: title,
      category: meta.category,
      brand,
      modelNumber,
      price,
      productUrl,
      imageUrl,
      inStock,
      rating: null,
      isFallback: false,
    };
  } catch (error) {
    return generateFallbackResult("GeM", cleanQuery, error.message);
  }
}

/**
 * Scrape product details from Amazon India search results.
 * @param {string} query - Product search term
 * @returns {Promise<object>} Scraped or fallback product data
 */
export async function scrapeAmazonProduct(query) {
  const meta = inferMetadataFromQuery(query);
  const searchQuery = meta.displayTitle;
  const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(searchQuery)}`;

  try {
    const html = await fetchHtml(searchUrl, {
      referer: "https://www.amazon.in/",
    });
    const $ = cheerio.load(html);

    const card = $('[data-component-type="s-search-result"]').first();
    if (!card.length) {
      throw new Error("No Amazon search result cards found");
    }

    const title =
      card.find("h2 a span, h2 span").first().text().trim() || null;
    const priceText =
      card.find(".a-price .a-offscreen").first().text() ||
      card.find(".a-price-whole").first().text();
    const price = parseRawPrice(priceText);
    const rating = parseRating(card.find(".a-icon-alt").first().text());
    const href = card.find("h2 a").first().attr("href");
    const productUrl = href
      ? href.startsWith("http")
        ? href
        : `https://www.amazon.in${href}`
      : searchUrl;
    const imageUrl = card.find("img.s-image").first().attr("src") || null;
    const cardText = card.text().toLowerCase();
    const inStock = !cardText.includes("currently unavailable");

    if (!title || !price) {
      throw new Error("Could not parse Amazon title or price from HTML");
    }

    return {
      platform: "Amazon",
      title,
      name: title,
      category: meta.category,
      brand: meta.brand,
      modelNumber: meta.modelNumber,
      price,
      productUrl,
      imageUrl,
      inStock,
      rating,
      isFallback: false,
    };
  } catch (error) {
    return generateFallbackResult("Amazon", query, error.message);
  }
}

/**
 * Scrape a product from Flipkart.
 * @param {string} query - Product search term
 * @returns {Promise<object|null>} Scraped product data
 */
export async function scrapeFlipkartProduct(query) {
  console.log(`[Scraper] Flipkart search for: "${query}" (mock)`);
  return {
    platform: "Flipkart",
    name: `${query} — Flipkart Listing`,
    price: Math.floor(Math.random() * 45000) + 11000,
    productUrl: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
    inStock: Math.random() > 0.15,
    rating: +(Math.random() * 1.5 + 3.5).toFixed(1),
    imageUrl: null,
  };
}

/**
 * Run all platform scrapers in parallel for a given query.
 * @param {string} query - Product search term
 * @returns {Promise<object[]>} Array of scraped results from all platforms
 */
export async function scrapeAllPlatforms(query) {
  const results = await Promise.allSettled([
    scrapeGemProduct(query),
    scrapeAmazonProduct(query),
    scrapeFlipkartProduct(query),
  ]);

  return results
    .filter((r) => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}
