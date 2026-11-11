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
