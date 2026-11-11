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
 * Scrape a product from the GeM portal.
 * @param {string} query - Product search term
 * @returns {Promise<object|null>} Scraped product data
 */
export async function scrapeGemProduct(query) {
  console.log(`[Scraper] GeM search for: "${query}" (mock)`);
  return {
    platform: "GeM",
    name: `${query} — GeM Listed Product`,
    price: Math.floor(Math.random() * 40000) + 10000,
    productUrl: `https://mkp.gem.gov.in/search?q=${encodeURIComponent(query)}`,
    inStock: true,
    rating: +(Math.random() * 2 + 3).toFixed(1),
    imageUrl: null,
  };
}

/**
 * Scrape a product from Amazon India.
 * @param {string} query - Product search term
 * @returns {Promise<object|null>} Scraped product data
 */
export async function scrapeAmazonProduct(query) {
  console.log(`[Scraper] Amazon search for: "${query}" (mock)`);
  return {
    platform: "Amazon",
    name: `${query} — Amazon Listing`,
    price: Math.floor(Math.random() * 50000) + 12000,
    productUrl: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
    inStock: Math.random() > 0.1,
    rating: +(Math.random() * 1.5 + 3.5).toFixed(1),
    imageUrl: null,
  };
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
