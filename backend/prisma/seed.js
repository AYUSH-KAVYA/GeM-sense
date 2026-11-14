/**
 * GeM-sense Database Seeder
 *
 * Command to run from the backend directory:
 *   node prisma/seed.js
 *
 * Seeds:
 *   - 3 Platforms: GeM, Amazon, Flipkart
 *   - 12 Government Procurement Products across 5 categories:
 *       • Laptops
 *       • Printers
 *       • Office Furniture
 *       • Air Conditioners
 *       • Networking
 *   - 6 Historical PriceRecords per product per platform (Days -25, -20, -15, -10, -5, Today)
 *   - Exactly 216 PriceRecord entries with realistic 2%-8% market fluctuations
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORMS = [
  { name: "GeM", baseUrl: "https" + ":" + "//" + "mkp.gem.gov.in" },
  { name: "Amazon", baseUrl: "https" + ":" + "//" + "www.amazon.in" },
  { name: "Flipkart", baseUrl: "https" + ":" + "//" + "www.flipkart.com" },
];

// 12 realistic government procurement products with base reference prices in INR
const PRODUCTS = [
  // ── Laptops (3 items) ──
  {
    name: "Dell Latitude 5540 Laptop (i5 13th Gen, 16GB RAM, 512GB SSD)",
    category: "Laptops",
    brand: "Dell",
    modelNumber: "5540",
    prices: { GeM: 72500, Amazon: 78999, Flipkart: 79490 },
  },
  {
    name: "HP ProBook 440 G10 Laptop (i5 13th Gen, 16GB RAM)",
    category: "Laptops",
    brand: "HP",
    modelNumber: "440-G10",
    prices: { GeM: 68900, Amazon: 73999, Flipkart: 74990 },
  },
  {
    name: "Lenovo ThinkPad E14 Gen 5 Laptop (i5, 16GB RAM)",
    category: "Laptops",
    brand: "Lenovo",
    modelNumber: "E14-G5",
    prices: { GeM: 66500, Amazon: 71990, Flipkart: 72999 },
  },

  // ── Printers (2 items) ──
  {
    name: "HP LaserJet Pro MFP 4104dw Wireless Printer",
    category: "Printers",
    brand: "HP",
    modelNumber: "MFP4104dw",
    prices: { GeM: 38500, Amazon: 44299, Flipkart: 45999 },
  },
  {
    name: "Canon imageCLASS MF269dw II Laser Printer",
    category: "Printers",
    brand: "Canon",
    modelNumber: "MF269dw-II",
    prices: { GeM: 31200, Amazon: 29499, Flipkart: 30200 },
  },

  // ── Office Furniture (2 items) ──
  {
    name: "Godrej Interio Ergonomic High Back Office Chair",
    category: "Office Furniture",
    brand: "Godrej Interio",
    modelNumber: "ACE-HB",
    prices: { GeM: 14200, Amazon: 16850, Flipkart: 15999 },
  },
  {
    name: "Featherlite Liberate High Back Office Chair",
    category: "Office Furniture",
    brand: "Featherlite",
    modelNumber: "LIBERATE-HB",
    prices: { GeM: 11900, Amazon: 13999, Flipkart: 14500 },
  },

  // ── Air Conditioners (2 items) ──
  {
    name: "Daikin 1.5 Ton 5 Star Inverter Split AC",
    category: "Air Conditioners",
    brand: "Daikin",
    modelNumber: "MTKL50UV16",
    prices: { GeM: 42800, Amazon: 46990, Flipkart: 45499 },
  },
  {
    name: "Blue Star 1.5 Ton 5 Star Inverter Split AC",
    category: "Air Conditioners",
    brand: "Blue Star",
    modelNumber: "IC518DNU",
    prices: { GeM: 41900, Amazon: 45990, Flipkart: 44999 },
  },

  // ── Networking (3 items) ──
  {
    name: "TP-Link Omada Gigabit VPN Router",
    category: "Networking",
    brand: "TP-Link",
    modelNumber: "ER7206",
    prices: { GeM: 11200, Amazon: 12999, Flipkart: 12490 },
  },
  {
    name: "Cisco Business 24-Port Gigabit Network Switch",
    category: "Networking",
    brand: "Cisco",
    modelNumber: "CBS250-24T-4G",
    prices: { GeM: 28900, Amazon: 31999, Flipkart: 32500 },
  },
  {
    name: "D-Link 24-Port Gigabit Managed Switch",
    category: "Networking",
    brand: "D-Link",
    modelNumber: "DGS-1210-28",
    prices: { GeM: 15900, Amazon: 17999, Flipkart: 18490 },
  },
];

// Six historical snapshot dates: Day -25, -20, -15, -10, -5, and Today (Day 0)
const DAYS_AGO = [25, 20, 15, 10, 5, 0];

// Realistic minor price variations (approx. 2% to 8%)

function getHistoricalDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

function getProductUrl(platformName, productName) {
  const query = encodeURIComponent(productName);
  const protocol = "https" + ":" + "//";

  if (platformName === "GeM") {
    return protocol + "mkp.gem.gov.in/search?q=" + query;
  }

  if (platformName === "Amazon") {
    return protocol + "www.amazon.in/s?k=" + query;
  }

  return protocol + "www.flipkart.com/search?q=" + query;
}

async function main() {
  console.log("\n🌱 Starting GeM-sense database seeding...\n");

  // 1. Delete existing records in foreign-key-safe order using deleteMany()
  console.log("Clearing existing data (PriceRecord -> Product -> Platform)...");
  await prisma.priceRecord.deleteMany();
  await prisma.product.deleteMany();
  await prisma.platform.deleteMany();
  console.log("✅ Existing records cleared.\n");

  // 2. Create the three platforms: GeM, Amazon, Flipkart
  const platformMap = {};
  for (const platformData of PLATFORMS) {
    const platform = await prisma.platform.create({
      data: platformData,
    });
    platformMap[platform.name] = platform.id;
    console.log(`✅ Platform created: ${platform.name} (id: ${platform.id})`);
  }
  console.log("");

  // 3. Create 12 products and 6 historical PriceRecords per platform (12 * 3 * 6 = 216 records)
  let totalPriceRecords = 0;

  for (const [productIndex, productData] of PRODUCTS.entries()) {
    const { prices, ...productFields } = productData;

    const product = await prisma.product.create({
      data: {
        ...productFields,
        gemUrl: getProductUrl("GeM", productData.name),
        imageUrl: null,
      },
    });

    const priceRecords = [];

    for (const [platformIndex, platformData] of PLATFORMS.entries()) {
      const basePrice = prices[platformData.name];

      for (let dateIndex = 0; dateIndex < DAYS_AGO.length; dateIndex++) {
        const daysAgo = DAYS_AGO[dateIndex];
        let factor = 1.0;

        if (daysAgo > 0) {
          // Dynamic deterministic variation between approx 2% - 8%
          const cycleOffset = (productIndex * 3 + platformIndex * 2 + dateIndex) % 5;
          const varianceTable = [0.95, 1.04, 0.97, 1.06, 0.93]; // -5%, +4%, -3%, +6%, -7%
          factor = varianceTable[cycleOffset];
        }

        const calculatedPrice = Math.round(basePrice * factor);

        priceRecords.push({
          productId: product.id,
          platformId: platformMap[platformData.name],
          price: calculatedPrice,
          productUrl: getProductUrl(platformData.name, product.name),
          inStock: true,
          rating: Number((3.9 + ((productIndex + platformIndex) % 11) / 10).toFixed(1)),
          scrapedAt: getHistoricalDate(daysAgo),
        });
      }
    }

    await prisma.priceRecord.createMany({
      data: priceRecords,
    });

    totalPriceRecords += priceRecords.length;
    console.log(
      `📦 Product: ${product.name} | Created ${priceRecords.length} historical price records`
    );
  }

  console.log("\n==========================================");
  console.log("✨ Seeding completed successfully!");
  console.log(`Platforms created: ${PLATFORMS.length}`);
  console.log(`Products created: ${PRODUCTS.length}`);
  console.log(`PriceRecord entries created: ${totalPriceRecords} (Target: 216)`);
  console.log("==========================================\n");
}

main()
  .catch((error) => {
    console.error("❌ Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
