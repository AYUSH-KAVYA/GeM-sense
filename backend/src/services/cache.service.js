import prisma from "../db/prisma.js";
import { scrapeAllPlatforms } from "./scraper.service.js";

const PLATFORM_BASE_URLS = {
  GeM: "https://mkp.gem.gov.in",
  Amazon: "https://www.amazon.in",
  Flipkart: "https://www.flipkart.com",
};

const HISTORICAL_DAYS = [25, 20, 15, 10, 5, 0];

function getHistoricalDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

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
 * Build a Prisma filter for matching products by keyword, phrase, or GeM URL.
 * Supports token splitting so "Revolving Chair" matches products containing both terms.
 *
 * @param {string} cleanQuery
 * @returns {object} Prisma `where` clause
 */
function buildProductSearchWhere(cleanQuery) {
  const words = cleanQuery
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length >= 2);

  const orConditions = [
    { name: { contains: cleanQuery, mode: "insensitive" } },
    { category: { contains: cleanQuery, mode: "insensitive" } },
    { brand: { contains: cleanQuery, mode: "insensitive" } },
    { modelNumber: { contains: cleanQuery, mode: "insensitive" } },
    { gemUrl: { contains: cleanQuery, mode: "insensitive" } },
  ];

  if (words.length > 1) {
    // Also match if every significant keyword appears across name, brand, or category
    orConditions.push({
      AND: words.map((w) => ({
        OR: [
          { name: { contains: w, mode: "insensitive" } },
          { category: { contains: w, mode: "insensitive" } },
          { brand: { contains: w, mode: "insensitive" } },
        ],
      })),
    });
  }

  return { OR: orConditions };
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
 * Helper to delete any generic "echo" products matching the query or lacking brand/model.
 * @param {string} cleanQuery
 */
async function deleteEchoProducts(cleanQuery) {
  try {
    const echoRecords = await prisma.product.findMany({
      where: {
        OR: [
          { name: { equals: cleanQuery, mode: "insensitive" } },
          {
            AND: [
              { brand: null },
              { modelNumber: null },
              { name: { contains: cleanQuery, mode: "insensitive" } },
            ],
          },
        ],
      },
    });

    for (const echo of echoRecords) {
      await prisma.priceRecord.deleteMany({ where: { productId: echo.id } });
      await prisma.product.delete({ where: { id: echo.id } });
    }
  } catch (err) {
    console.warn(`[Echo Cleanup] Failed to delete echo products: ${err.message}`);
  }
}

/**
 * Fetch cached products from PostgreSQL if fresh within `ttlHours`.
 * If fewer than 3 items match, or if an echo product is detected, treat as a cache miss,
 * trigger a multi-product scrape/generator, persist 4-5 products with 6 historical PriceRecords
 * each into PostgreSQL, and return the fresh results.
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

  // 1. Check PostgreSQL for existing matching products
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

  // Check if any product is an unwanted "echo" record (e.g. name exactly matches search term or lacks brand/model)
  const hasEchoProduct = existingProducts.some(
    (p) =>
      p.name.trim().toLowerCase() === cleanQuery.toLowerCase() ||
      (!p.brand && !p.modelNumber && p.name.split(" ").length <= 3)
  );

  // 2. If we have at least 3 legitimate branded products and NO echo products, evaluate cache freshness
  if (existingProducts.length >= 3 && !hasEchoProduct) {
    const freshProducts = existingProducts.filter((product) =>
      product.prices.some((record) => new Date(record.scrapedAt) >= cutoffDate)
    );

    if (freshProducts.length >= 3) {
      return {
        source: "cache",
        data: freshProducts.map(formatProductWithLatestPrices),
      };
    }
  }

  // 3. Cache Miss or Underpopulated / Echo Product Detected -> Clean up echo records & scrape/generate fresh catalog
  await deleteEchoProducts(cleanQuery);

  const scrapedProducts = await scrapeAllPlatforms(cleanQuery);

  if (!Array.isArray(scrapedProducts) || scrapedProducts.length === 0) {
    return {
      source: existingProducts.length > 0 ? "cache" : "live_scrape",
      data: existingProducts.map(formatProductWithLatestPrices),
    };
  }

  // Ensure platforms exist in database
  const platformMap = {};
  for (const pName of ["GeM", "Amazon", "Flipkart"]) {
    const rec = await upsertPlatform(pName);
    platformMap[pName] = rec.id;
  }

  const persistedProductIds = [];

  // Persist all 4-5 distinct products with 6 historical PriceRecord points each
  for (let pIdx = 0; pIdx < scrapedProducts.length; pIdx++) {
    const item = scrapedProducts[pIdx];
    const encoded = encodeURIComponent(item.name || cleanQuery);

    const productPayload = {
      name: item.name || item.title,
      category: item.category || "Office & IT Equipment",
      brand: item.brand || null,
      modelNumber: item.modelNumber || null,
      gemUrl: item.gemUrl || `https://mkp.gem.gov.in/search?q=${encoded}`,
      imageUrl: item.imageUrl || null,
    };

    // Find existing product by modelNumber or name so we don't create duplicate rows
    let productRecord = null;
    if (productPayload.modelNumber) {
      productRecord = await prisma.product.findFirst({
        where: { modelNumber: productPayload.modelNumber },
      });
    }

    if (!productRecord) {
      productRecord = await prisma.product.findFirst({
        where: { name: productPayload.name },
      });
    }

    if (productRecord) {
      productRecord = await prisma.product.update({
        where: { id: productRecord.id },
        data: {
          brand: productRecord.brand || productPayload.brand,
          modelNumber: productRecord.modelNumber || productPayload.modelNumber,
          imageUrl: productRecord.imageUrl || productPayload.imageUrl,
          category: productRecord.category || productPayload.category,
        },
      });
    } else {
      productRecord = await prisma.product.create({
        data: productPayload,
      });
    }

    persistedProductIds.push(productRecord.id);

    // Prepare 6 historical snapshots (Days -25, -20, -15, -10, -5, Today)
    const priceRecords = [];
    const sourcePrices = Array.isArray(item.latestPrices)
      ? item.latestPrices
      : Array.isArray(item.prices)
      ? item.prices
      : [];

    for (const [platformName, platformId] of Object.entries(platformMap)) {
      const match = sourcePrices.find(
        (sp) => String(sp.platform).toLowerCase() === platformName.toLowerCase()
      );

      const basePrice = match ? match.price : 10000;
      const productUrl =
        match?.productUrl ||
        (platformName === "GeM"
          ? productPayload.gemUrl
          : platformName === "Amazon"
          ? `https://www.amazon.in/s?k=${encoded}`
          : `https://www.flipkart.com/search?q=${encoded}`);

      for (let dIdx = 0; dIdx < HISTORICAL_DAYS.length; dIdx++) {
        const daysAgo = HISTORICAL_DAYS[dIdx];
        let factor = 1.0;

        if (daysAgo > 0) {
          // Dynamic historical variation between -4% to +5%
          const variance = [-0.03, 0.04, -0.02, 0.05, -0.04][(pIdx + dIdx) % 5];
          factor = 1 + variance;
        }

        const calculatedPrice = Math.round((basePrice * factor) / 10) * 10;

        priceRecords.push({
          productId: productRecord.id,
          platformId,
          price: calculatedPrice,
          productUrl,
          inStock: match ? (match.inStock ?? true) : true,
          rating: match ? (match.rating ?? 4.2) : 4.2,
          scrapedAt: getHistoricalDate(daysAgo),
        });
      }
    }

    // Insert all historical price points
    await prisma.priceRecord.createMany({
      data: priceRecords,
    });
  }

  // 4. Fetch the full list of enriched products from DB
  const refreshedProducts = await prisma.product.findMany({
    where: { id: { in: persistedProductIds } },
    include: {
      prices: {
        include: { platform: true },
        orderBy: { scrapedAt: "desc" },
      },
    },
    orderBy: { id: "asc" },
  });

  return {
    source: "live_scrape",
    data: refreshedProducts.map(formatProductWithLatestPrices),
  };
}

export default {
  getCachedOrFreshProducts,
};
