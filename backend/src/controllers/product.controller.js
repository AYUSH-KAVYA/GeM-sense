import prisma from "../db/prisma.js";
import { getCachedOrFreshProducts } from "../services/cache.service.js";
import { scrapeAllPlatforms } from "../services/scraper.service.js";
import {
  calculateMatchConfidence,
  extractSpecs,
} from "../utils/normalizer.js";
import { generateProcurementVerdict } from "../utils/verdict.js";

const PLATFORM_BASE_URLS = {
  GeM: "https://mkp.gem.gov.in",
  Amazon: "https://www.amazon.in",
  Flipkart: "https://www.flipkart.com",
};

/**
 * Extract product slug/keywords if query is a direct marketplace URL.
 * Handles GeM, Amazon, Flipkart, and general product URLs.
 * @param {string} query
 * @returns {string} Clean keyword string
 */
function extractKeywordsFromQuery(query) {
  if (!query || typeof query !== "string") return "";
  const trimmed = query.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      const pathname = decodeURIComponent(parsedUrl.pathname);
      const segments = pathname.split("/").filter(Boolean);
      let candidate = "";

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (/^p-\d+$/i.test(seg) || /^dp$/i.test(seg) || /^p$/i.test(seg)) {
          if (i > 0 && segments[i - 1].length > 3) {
            candidate = segments[i - 1];
            break;
          }
        }
      }

      if (!candidate && segments.length > 0) {
        candidate = segments.reduce((longest, current) => {
          const clean = current.replace(/^(p-|dp|itm|search|product).*/i, "");
          return clean.length > longest.length ? current : longest;
        }, "");
      }

      if (candidate) {
        const cleaned = candidate
          .replace(/-p-\d+$/i, "")
          .replace(/\.html?$/i, "")
          .replace(/[-_+]/g, " ")
          .trim();
        if (cleaned.length > 2) return cleaned;
      }
    } catch {
      const stripped = trimmed.replace(/^https?:\/\/[^/]+/i, "");
      return stripped
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return trimmed;
}

/**
 * Helper to ensure a Platform record exists in PostgreSQL.
 * @param {string} platformName
 * @returns {Promise<object>} Platform record
 */
async function ensurePlatform(platformName) {
  const baseUrl =
    PLATFORM_BASE_URLS[platformName] ||
    `https://www.${platformName.toLowerCase()}.com`;

  return prisma.platform.upsert({
    where: { name: platformName },
    update: { baseUrl },
    create: { name: platformName, baseUrl },
  });
}

/**
 * Enrich a product object with:
 *   1. Latest price per platform
 *   2. Extracted specifications via extractSpecs()
 *   3. Procurement verdict via generateProcurementVerdict()
 *   4. Cross-platform match confidence score via calculateMatchConfidence()
 *
 * @param {object} product - Raw or cache-formatted product object
 * @returns {object} Fully enriched product object
 */
function enrichProduct(product) {
  if (!product) return null;

  // Format latestPrices if raw Prisma product with prices relation
  let latestPrices = [];
  if (Array.isArray(product.latestPrices)) {
    latestPrices = product.latestPrices;
  } else if (Array.isArray(product.prices)) {
    const latestByPlatform = {};
    for (const record of product.prices) {
      const pName = record.platform?.name || "Unknown";
      if (!latestByPlatform[pName]) {
        latestByPlatform[pName] = {
          platform: pName,
          price: record.price,
          productUrl: record.productUrl,
          inStock: record.inStock,
          rating: record.rating,
          scrapedAt: record.scrapedAt,
        };
      }
    }
    latestPrices = Object.values(latestByPlatform);
  }

  // Identify GeM official price vs competitor prices
  const gemPriceRecord = latestPrices.find(
    (p) => String(p.platform).toLowerCase() === "gem"
  );
  const gemPrice = gemPriceRecord ? gemPriceRecord.price : null;

  const competitorPrices = latestPrices
    .filter((p) => String(p.platform).toLowerCase() !== "gem")
    .map((p) => ({
      platform: typeof p.platform === "string" ? p.platform : p.platform?.name || "Market",
      price: p.price,
    }));

  // Generate procurement verdict
  const verdict = generateProcurementVerdict(gemPrice, competitorPrices);

  // Extract structured specifications from title
  const specs = extractSpecs(product.name);

  // Calculate cross-market title match confidence
  let matchConfidenceScore = 100;
  const matchConfidences = {};

  const competitorRecords = latestPrices.filter(
    (p) => String(p.platform).toLowerCase() !== "gem"
  );

  if (competitorRecords.length > 0) {
    let scoreSum = 0;
    for (const comp of competitorRecords) {
      const compPlatform =
        typeof comp.platform === "string" ? comp.platform : comp.platform?.name;
      const compTitle = comp.title || comp.name || product.name;
      const conf = calculateMatchConfidence(product.name, compTitle);
      matchConfidences[compPlatform] = conf;
      scoreSum += conf.score ?? Number(conf) ?? 100;
    }
    matchConfidenceScore = Math.round(scoreSum / competitorRecords.length);
  }

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    brand: product.brand,
    modelNumber: product.modelNumber,
    gemUrl: product.gemUrl,
    imageUrl: product.imageUrl,
    createdAt: product.createdAt,
    specs,
    verdict,
    matchConfidence: matchConfidenceScore,
    matchConfidences,
    latestPrices,
  };
}

// ─── GET /api/products ──────────────────────────────────────────────
// Fetch all tracked products with their latest price per platform,
// attached procurement verdict, and extracted specs.
export async function getAllProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: {
        prices: {
          include: { platform: true },
          orderBy: { scrapedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = products.map(enrichProduct);

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/products/search?q=... ─────────────────────────────────
// Search products by keyword or direct URL.
// Checks cache TTL (6h) -> fallback to live multi-platform scrapers ->
// enriches results with specs, matchConfidence, and procurement verdict.
export async function searchProducts(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required. Usage: /api/products/search?q=printer",
      });
    }

    // Automatically extract keywords if a full URL was provided
    const cleanKeyword = extractKeywordsFromQuery(q);

    // Fetch from 6h PostgreSQL cache or trigger multi-platform scrapers
    const cacheResult = await getCachedOrFreshProducts(cleanKeyword);
    const rawResults = cacheResult?.data || [];

    // Enrich each product with specs, matchConfidence, and verdict
    const enrichedResults = rawResults.map(enrichProduct);

    return res.json({
      success: true,
      source: cacheResult?.source || "cache",
      count: enrichedResults.length,
      query: cleanKeyword,
      originalQuery: q,
      results: enrichedResults,
      data: enrichedResults,
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/products/:id/history (or GET /api/products/:id) ───────
// Fetch single product with time-series historical price drops
// formatted for charting: [ { date: 'YYYY-MM-DD', GeM: 45000, Amazon: ... }, ... ]
export async function getProductHistory(req, res, next) {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product ID must be an integer.",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          include: { platform: true },
          orderBy: { scrapedAt: "asc" }, // Chronological for time-series charts
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with id ${productId} not found.`,
      });
    }

    // Format chart-friendly time-series array:
    // [ { date: 'YYYY-MM-DD', GeM: 45000, Amazon: 43500, Flipkart: 44200 }, ... ]
    const dateMap = {};
    const priceHistoryByPlatform = {};

    for (const record of product.prices) {
      const pName = record.platform?.name || "Unknown";
      const dateKey = new Date(record.scrapedAt).toISOString().split("T")[0];

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey };
      }
      dateMap[dateKey][pName] = record.price;

      if (!priceHistoryByPlatform[pName]) {
        priceHistoryByPlatform[pName] = [];
      }
      priceHistoryByPlatform[pName].push({
        price: record.price,
        productUrl: record.productUrl,
        inStock: record.inStock,
        rating: record.rating,
        scrapedAt: record.scrapedAt,
      });
    }

    const chartHistory = Object.values(dateMap);
    const enriched = enrichProduct(product);

    return res.json({
      success: true,
      data: {
        ...enriched,
        history: chartHistory,
        priceHistory: priceHistoryByPlatform,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Alias for backwards compatibility
export const getProductById = getProductHistory;

// ─── POST /api/products/:id/refresh ─────────────────────────────────
// Force a fresh live multi-platform scrape for this product, bypassing
// cache TTL, insert new PriceRecord entries with current timestamp, and
// return the updated product and new procurement verdict.
export async function refreshProductPrice(req, res, next) {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product ID must be an integer.",
      });
    }

    // 1. Verify product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with id ${productId} not found.`,
      });
    }

    // 2. Force fresh multi-platform scrape bypassing cache TTL
    const scrapedResults = await scrapeAllPlatforms(existingProduct.name);

    // 3. Insert new PriceRecord entries with current timestamp into PostgreSQL
    for (const scraped of scrapedResults) {
      if (typeof scraped.price !== "number" || scraped.price <= 0) continue;

      const platform = await ensurePlatform(scraped.platform);

      await prisma.priceRecord.create({
        data: {
          productId: existingProduct.id,
          platformId: platform.id,
          price: scraped.price,
          productUrl: scraped.productUrl,
          inStock: scraped.inStock ?? true,
          rating: scraped.rating ?? null,
        },
      });
    }

    // 4. Reload updated product with new latest prices
    const updatedProduct = await prisma.product.findUnique({
      where: { id: existingProduct.id },
      include: {
        prices: {
          include: { platform: true },
          orderBy: { scrapedAt: "desc" },
        },
      },
    });

    const enriched = enrichProduct(updatedProduct);

    return res.json({
      success: true,
      message: "Product prices refreshed successfully via live scraping",
      data: enriched,
      verdict: enriched.verdict,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAllProducts,
  searchProducts,
  getProductHistory,
  getProductById,
  refreshProductPrice,
};
