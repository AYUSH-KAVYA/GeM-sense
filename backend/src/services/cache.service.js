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

  // 2. Cache miss or stale -> scrape all platforms in parallel
  const scrapedResults = await scrapeAllPlatforms(cleanQuery);

  if (scrapedResults.length === 0) {
    // Return stale data if available rather than empty when scraping yields nothing
    return {
      source: existingProducts.length > 0 ? "cache" : "live_scrape",
      data: existingProducts.map(formatProductWithLatestPrices),
    };
  }

  // Choose GeM listing (or first available result) as the canonical product metadata
  const gemResult =
    scrapedResults.find((item) => item.platform === "GeM") || scrapedResults[0];
  const anyImageResult = scrapedResults.find((item) => Boolean(item.imageUrl));

  const canonicalGemUrl =
    gemResult.platform === "GeM"
      ? gemResult.productUrl
      : `https://mkp.gem.gov.in/search?q=${encodeURIComponent(cleanQuery)}`;

  // Find an existing product by gemUrl or stale match so we update instead of duplicating
  const existingMatch =
    existingProducts[0] ||
    (await prisma.product.findFirst({
      where: { gemUrl: canonicalGemUrl },
    }));

  const productPayload = {
    name: gemResult.title || gemResult.name || cleanQuery,
    category: gemResult.category || "Office & IT Equipment",
    brand: gemResult.brand || null,
    modelNumber: gemResult.modelNumber || null,
    gemUrl: canonicalGemUrl,
    imageUrl: gemResult.imageUrl || anyImageResult?.imageUrl || null,
  };

  let persistedProduct;
  if (existingMatch) {
    persistedProduct = await prisma.product.update({
      where: { id: existingMatch.id },
      data: {
        brand: existingMatch.brand || productPayload.brand,
        modelNumber: existingMatch.modelNumber || productPayload.modelNumber,
        imageUrl: existingMatch.imageUrl || productPayload.imageUrl,
      },
    });
  } else {
    persistedProduct = await prisma.product.create({
      data: productPayload,
    });
  }

  // 3. Upsert platforms & append new PriceRecord rows (preserving historical records)
  for (const scraped of scrapedResults) {
    if (typeof scraped.price !== "number" || scraped.price <= 0) continue;

    const platform = await upsertPlatform(scraped.platform);

    await prisma.priceRecord.create({
      data: {
        productId: persistedProduct.id,
        platformId: platform.id,
        price: scraped.price,
        productUrl: scraped.productUrl,
        inStock: scraped.inStock ?? true,
        rating: scraped.rating ?? null,
      },
    });
  }

  // 4. Reload the updated product with latest PriceRecords
  const refreshedProduct = await prisma.product.findUnique({
    where: { id: persistedProduct.id },
    include: {
      prices: {
        include: { platform: true },
        orderBy: { scrapedAt: "desc" },
      },
    },
  });

  return {
    source: "live_scrape",
    data: refreshedProduct ? [formatProductWithLatestPrices(refreshedProduct)] : [],
  };
}

export default {
  getCachedOrFreshProducts,
};
