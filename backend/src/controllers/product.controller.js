import prisma from "../db/prisma.js";

// ─── GET /api/products ──────────────────────────────────────────────
// Fetch all tracked products with their latest price from each platform.
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

    // For each product, keep only the latest PriceRecord per platform
    const formatted = products.map((product) => {
      const latestByPlatform = {};
      for (const record of product.prices) {
        const pName = record.platform.name;
        if (!latestByPlatform[pName]) {
          latestByPlatform[pName] = record;
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
    });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/products/search?q=... ─────────────────────────────────
// Search products by name/category keyword.
// Phase 3 hook: call scraper + normalizer here for live results.
export async function searchProducts(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required. Usage: /api/products/search?q=printer",
      });
    }

    const query = q.trim();

    // ──────────────────────────────────────────────────────────
    // PHASE 3 HOOK (Ayush):
    //   1. Call scrapeAllPlatforms(query) to get live prices
    //   2. Pass results through normalizer (Kanishq's module)
    //   3. Upsert matched products + PriceRecords into Prisma
    //   4. Return unified comparison JSON
    // For now: search existing DB records only.
    // ──────────────────────────────────────────────────────────

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
          { modelNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        prices: {
          include: { platform: true },
          orderBy: { scrapedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = products.map((product) => {
      const latestByPlatform = {};
      for (const record of product.prices) {
        const pName = record.platform.name;
        if (!latestByPlatform[pName]) {
          latestByPlatform[pName] = record;
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
        latestPrices: Object.values(latestByPlatform).map((r) => ({
          platform: r.platform.name,
          price: r.price,
          productUrl: r.productUrl,
          inStock: r.inStock,
          rating: r.rating,
          scrapedAt: r.scrapedAt,
        })),
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      query,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/products/:id ──────────────────────────────────────────
// Fetch a single product with its full price history (for charting).
export async function getProductById(req, res, next) {
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
          orderBy: { scrapedAt: "asc" }, // chronological for charts
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with id ${productId} not found.`,
      });
    }

    // Group full price history by platform for Recharts/Chart.js
    const priceHistory = {};
    for (const record of product.prices) {
      const pName = record.platform.name;
      if (!priceHistory[pName]) {
        priceHistory[pName] = [];
      }
      priceHistory[pName].push({
        price: record.price,
        productUrl: record.productUrl,
        inStock: record.inStock,
        rating: record.rating,
        scrapedAt: record.scrapedAt,
      });
    }

    return res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        modelNumber: product.modelNumber,
        gemUrl: product.gemUrl,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
        priceHistory,
      },
    });
  } catch (error) {
    next(error);
  }
}
