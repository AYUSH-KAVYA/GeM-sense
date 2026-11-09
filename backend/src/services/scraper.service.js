/**
 * Scraper Service — Platform-specific product scrapers.
 *
 * Phase 1: Returns structured mock data.
 * Phase 2 (Ayush): Replace with real scraping logic using
 *   Playwright/Puppeteer/Cheerio + PostgreSQL caching.
 */

/**
 * Scrape a product from the GeM portal.
 * @param {string} query - Product search term
 * @returns {Promise<object|null>} Scraped product data
 */
export async function scrapeGemProduct(query) {
  // TODO Phase 2: Implement actual GeM scraping with caching
  console.log(`[Scraper] GeM search for: "${query}" (mock)`);

  return {
    platform: "GeM",
    name: `${query} — GeM Listed Product`,
    price: Math.floor(Math.random() * 40000) + 10000,
    productUrl: `https://mkp.gem.gov.in/search?q=${encodeURIComponent(query)}`,
    inStock: true,
    rating: +(Math.random() * 2 + 3).toFixed(1), // 3.0–5.0
    imageUrl: null,
  };
}

/**
 * Scrape a product from Amazon India.
 * @param {string} query - Product search term
 * @returns {Promise<object|null>} Scraped product data
 */
export async function scrapeAmazonProduct(query) {
  // TODO Phase 2: Implement actual Amazon scraping with caching
  console.log(`[Scraper] Amazon search for: "${query}" (mock)`);

  return {
    platform: "Amazon",
    name: `${query} — Amazon Listing`,
    price: Math.floor(Math.random() * 50000) + 12000,
    productUrl: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
    inStock: Math.random() > 0.1,
    rating: +(Math.random() * 1.5 + 3.5).toFixed(1), // 3.5–5.0
    imageUrl: null,
  };
}

/**
 * Scrape a product from Flipkart.
 * @param {string} query - Product search term
 * @returns {Promise<object|null>} Scraped product data
 */
export async function scrapeFlipkartProduct(query) {
  // TODO Phase 2: Implement actual Flipkart scraping with caching
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
