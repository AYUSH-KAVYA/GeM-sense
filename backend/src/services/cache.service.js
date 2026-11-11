import prisma from "../db/prisma.js";
import { scrapeAllPlatforms } from "./scraper.service.js";

const PLATFORM_BASE_URLS = {
  GeM: "https://mkp.gem.gov.in",
  Amazon: "https://www.amazon.in",
  Flipkart: "https://www.flipkart.com",
};

/**
 * Format a Prisma Product (with included `prices.platform`) into comparison JSON
 * keeping only the latest PriceRecord per platform.
 * @param {object} product
 * @returns {object}
 */
function formatProductWithLatestPrices(product) {
  const latestByPlatform = {};

  for (const record of product.prices || []) {
    const platformName = record.platform?.name;
    if (platformName && !latestByPlatform[platformName]) {
      latestByPlatform[platformName] = record;
    }
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
    latestPrices: Object.values(latestByPlatform).map((r) => ({
      platform: r.platform.name,
      price: r.price,
      productUrl: r.productUrl,
      inStock: r.inStock,
      rating: r.rating,
      scrapedAt: r.scrapedAt,
    })),
  };
}

/**
 * Build a Prisma filter for matching products by keyword or GeM URL.
 * @param {string} cleanQuery
 * @returns {object} Prisma `where` clause
 */
function buildProductSearchWhere(cleanQuery) {
  return {
    OR: [
      { name: { contains: cleanQuery, mode: "insensitive" } },
      { category: { contains: cleanQuery, mode: "insensitive" } },
      { brand: { contains: cleanQuery, mode: "insensitive" } },
      { modelNumber: { contains: cleanQuery, mode: "insensitive" } },
      { gemUrl: { contains: cleanQuery, mode: "insensitive" } },
    ],
  };
}

/**
 * Upsert a Platform record by its unique name.
 * @param {string} platformName
 * @returns {Promise<object>} Prisma Platform record
 */
async function upsertPlatform(platformName) {
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
 * Fetch cached products from PostgreSQL if fresh within `ttlHours`,
 * otherwise trigger a live multi-platform scrape, persist new PriceRecords
 * (preserving historical rows), and return fresh data.
 *
 * @param {string} query - Product search query or GeM URL
 * @param {number} [ttlHours=6] - Cache freshness window in hours
 * @returns {Promise<{ source: 'cache' | 'live_scrape', data: object[] }>}
 */
export async function getCachedOrFreshProducts(query, ttlHours = 6) {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) {
    return { source: "cache", data: [] };
  }

  const cutoffDate = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
  const whereClause = buildProductSearchWhere(cleanQuery);

  // 1. Check PostgreSQL for matching products and their price history
  const existingProducts = await prisma.product.findMany({
    where: whereClause,
    include: {
      prices: {
        include: { platform: true },
        orderBy: { scrapedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter products that have at least one PriceRecord newer than cutoffDate
  const freshProducts = existingProducts.filter((product) =>
    product.prices.some((record) => new Date(record.scrapedAt) >= cutoffDate)
  );

  if (freshProducts.length > 0) {
    return {
      source: "cache",
      data: freshProducts.map(formatProductWithLatestPrices),
    };
  }

  return {
    source: "cache",
    data: existingProducts.map(formatProductWithLatestPrices),
  };
}

export default {
  getCachedOrFreshProducts,
};
