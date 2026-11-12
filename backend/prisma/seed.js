/**
 * seed.js — Prisma database seeder for GeM-sense.
 *
 * Populates the database with:
 *   • 3 Platforms (GeM, Amazon, Flipkart)
 *   • 10 realistic government procurement products
 *   • 30 PriceRecord entries (one per product per platform)
 *
 * Usage:
 *   npx prisma db seed
 *
 * Requires "prisma.seed" in backend/package.json:
 *   "prisma": { "seed": "node prisma/seed.js" }
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Platform definitions ─────────────────────────────────────────
const PLATFORMS = [
  { name: "GeM", baseUrl: "https://mkp.gem.gov.in" },
  { name: "Amazon", baseUrl: "https://www.amazon.in" },
  { name: "Flipkart", baseUrl: "https://www.flipkart.com" },
];

// ── 10 realistic government procurement products ─────────────────
// Each entry has the product info plus prices per platform.
const PRODUCTS = [
  {
    name: "Dell Latitude 5540 Laptop (i5 13th Gen, 16GB RAM, 512GB SSD)",
    category: "Laptops & Desktops",
    brand: "Dell",
    modelNumber: "5540",
    gemUrl: "https://mkp.gem.gov.in/laptop/dell-latitude-5540/p-5164291",
    imageUrl: null,
    prices: {
      GeM: { price: 72500, url: "https://mkp.gem.gov.in/laptop/dell-latitude-5540/p-5164291" },
      Amazon: { price: 78999, url: "https://www.amazon.in/dp/B0C5EXAMPLE1" },
      Flipkart: { price: 79490, url: "https://www.flipkart.com/dell-latitude-5540/p/itm12345a" },
    },
  },
  {
    name: "HP LaserJet Pro MFP 4104dw Wireless Printer",
    category: "Printers & Scanners",
    brand: "HP",
    modelNumber: "MFP4104dw",
    gemUrl: "https://mkp.gem.gov.in/printer/hp-laserjet-pro-mfp4104dw/p-5116877",
    imageUrl: null,
    prices: {
      GeM: { price: 38500, url: "https://mkp.gem.gov.in/printer/hp-laserjet-pro-mfp4104dw/p-5116877" },
      Amazon: { price: 44299, url: "https://www.amazon.in/dp/B0B6EXAMPLE2" },
      Flipkart: { price: 45999, url: "https://www.flipkart.com/hp-laserjet-mfp4104dw/p/itm12345b" },
    },
  },
  {
    name: "Godrej Interio Ergonomic Office Chair (Ace High Back)",
    category: "Office Furniture",
    brand: "Godrej Interio",
    modelNumber: "ACE-HB",
    gemUrl: "https://mkp.gem.gov.in/chair/godrej-interio-ace-high-back/p-5129001",
    imageUrl: null,
    prices: {
      GeM: { price: 14200, url: "https://mkp.gem.gov.in/chair/godrej-interio-ace-high-back/p-5129001" },
      Amazon: { price: 16850, url: "https://www.amazon.in/dp/B09MEXAMPLE3" },
      Flipkart: { price: 15999, url: "https://www.flipkart.com/godrej-interio-ace/p/itm12345c" },
    },
  },
  {
    name: "Canon imageCLASS MF269dw II Laser Printer",
    category: "Printers & Scanners",
    brand: "Canon",
    modelNumber: "MF269dw-II",
    gemUrl: "https://mkp.gem.gov.in/printer/canon-imageclass-mf269dw/p-5134802",
    imageUrl: null,
    prices: {
      GeM: { price: 31200, url: "https://mkp.gem.gov.in/printer/canon-imageclass-mf269dw/p-5134802" },
      Amazon: { price: 29499, url: "https://www.amazon.in/dp/B0CHEXAMPLE4" },
      Flipkart: { price: 30200, url: "https://www.flipkart.com/canon-mf269dw/p/itm12345d" },
    },
  },
  {
    name: "Daikin 1.5 Ton 5 Star Inverter Split AC (MTKL50UV16)",
    category: "Air Conditioners",
    brand: "Daikin",
    modelNumber: "MTKL50UV16",
    gemUrl: "https://mkp.gem.gov.in/ac/daikin-mtkl50uv16/p-5148003",
    imageUrl: null,
    prices: {
      GeM: { price: 42800, url: "https://mkp.gem.gov.in/ac/daikin-mtkl50uv16/p-5148003" },
      Amazon: { price: 46990, url: "https://www.amazon.in/dp/B0BXEXAMPLE5" },
      Flipkart: { price: 45499, url: "https://www.flipkart.com/daikin-mtkl50uv16/p/itm12345e" },
    },
  },
  {
    name: "Dell OptiPlex 7010 Micro Desktop (i5 13th Gen, 8GB, 256GB SSD)",
    category: "Laptops & Desktops",
    brand: "Dell",
    modelNumber: "7010-Micro",
    gemUrl: "https://mkp.gem.gov.in/desktop/dell-optiplex-7010-micro/p-5119421",
    imageUrl: null,
    prices: {
      GeM: { price: 48900, url: "https://mkp.gem.gov.in/desktop/dell-optiplex-7010-micro/p-5119421" },
      Amazon: { price: 54200, url: "https://www.amazon.in/dp/B0CSEXAMPLE6" },
      Flipkart: { price: 53799, url: "https://www.flipkart.com/dell-optiplex-7010/p/itm12345f" },
    },
  },
  {
    name: "Epson EcoTank L3250 Wi-Fi All-in-One Ink Tank Printer",
    category: "Printers & Scanners",
    brand: "Epson",
    modelNumber: "L3250",
    gemUrl: "https://mkp.gem.gov.in/printer/epson-l3250/p-5127700",
    imageUrl: null,
    prices: {
      GeM: { price: 14800, url: "https://mkp.gem.gov.in/printer/epson-l3250/p-5127700" },
      Amazon: { price: 13499, url: "https://www.amazon.in/dp/B09QEXAMPLE7" },
      Flipkart: { price: 13999, url: "https://www.flipkart.com/epson-l3250/p/itm12345g" },
    },
  },
  {
    name: "BenQ MH560 Full HD 1080p Business Projector (3800 Lumens)",
    category: "Projectors & Displays",
    brand: "BenQ",
    modelNumber: "MH560",
    gemUrl: "https://mkp.gem.gov.in/projector/benq-mh560/p-5153309",
    imageUrl: null,
    prices: {
      GeM: { price: 52000, url: "https://mkp.gem.gov.in/projector/benq-mh560/p-5153309" },
      Amazon: { price: 54999, url: "https://www.amazon.in/dp/B09REXAMPLE8" },
      Flipkart: { price: 56490, url: "https://www.flipkart.com/benq-mh560/p/itm12345h" },
    },
  },
  {
    name: "APC Back-UPS BX1100C-IN 1100VA UPS",
    category: "UPS & Power",
    brand: "APC",
    modelNumber: "BX1100C-IN",
    gemUrl: "https://mkp.gem.gov.in/ups/apc-bx1100c-in/p-5138200",
    imageUrl: null,
    prices: {
      GeM: { price: 5400, url: "https://mkp.gem.gov.in/ups/apc-bx1100c-in/p-5138200" },
      Amazon: { price: 5299, url: "https://www.amazon.in/dp/B07LEXAMPLE9" },
      Flipkart: { price: 5450, url: "https://www.flipkart.com/apc-bx1100c/p/itm12345i" },
    },
  },
  {
    name: "Logitech MK275 Wireless Keyboard and Mouse Combo",
    category: "Stationery & Supplies",
    brand: "Logitech",
    modelNumber: "MK275",
    gemUrl: "https://mkp.gem.gov.in/keyboard/logitech-mk275/p-5105500",
    imageUrl: null,
    prices: {
      GeM: { price: 1650, url: "https://mkp.gem.gov.in/keyboard/logitech-mk275/p-5105500" },
      Amazon: { price: 1495, url: "https://www.amazon.in/dp/B078EXAMPLE0" },
      Flipkart: { price: 1549, url: "https://www.flipkart.com/logitech-mk275/p/itm12345j" },
    },
  },
];

// ── Main seed function ───────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding GeM-sense database...\n");

  // 1. Upsert platforms
  const platformMap = {};
  for (const platform of PLATFORMS) {
    const record = await prisma.platform.upsert({
      where: { name: platform.name },
      update: { baseUrl: platform.baseUrl },
      create: platform,
    });
    platformMap[record.name] = record.id;
    console.log(`  ✅ Platform: ${record.name} (id: ${record.id})`);
  }

  console.log("");

  // 2. Create products and their price records
  for (const productData of PRODUCTS) {
    const { prices, ...productFields } = productData;

    // Create the product
    const product = await prisma.product.create({
      data: productFields,
    });

    console.log(`  📦 Product: ${product.name} (id: ${product.id})`);

    // Create price records for each platform
    for (const [platformName, priceInfo] of Object.entries(prices)) {
      const platformId = platformMap[platformName];
      if (!platformId) continue;

      await prisma.priceRecord.create({
        data: {
          productId: product.id,
          platformId: platformId,
          price: priceInfo.price,
          productUrl: priceInfo.url,
          inStock: true,
          rating: +(Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0
        },
      });
    }

    const platformNames = Object.keys(prices).join(", ");
    console.log(`     └─ Prices added for: ${platformNames}`);
  }

  console.log(`\n✨ Seeding complete! ${PRODUCTS.length} products across ${PLATFORMS.length} platforms.\n`);
}

// ── Execute ──────────────────────────────────────────────────────
main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
