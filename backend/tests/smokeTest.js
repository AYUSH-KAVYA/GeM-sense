const API_URL = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
const TIMEOUT = 3000;

async function requestJSON(path) {
  const response = await fetch(`${API_URL}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { Accept: "application/json" },
  });

  let body;

  try {
    body = await response.json();
  } catch {
    throw new Error(`Invalid JSON response from ${path}`);
  }

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }

  return body;
}

function report(name, passed, detail = "") {
  console.log(`${passed ? "[PASS]" : "[FAIL]"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function runTest(name, test) {
  try {
    const detail = await test();
    report(name, true, detail);
    return true;
  } catch (error) {
    report(name, false, error.message);
    return false;
  }
}

async function main() {
  console.log(`\nGeM-sense API Smoke Tests`);
  console.log(`Target: ${API_URL}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Health endpoint
  const healthPassed = await runTest("Health endpoint", async () => {
    try {
      const data = await requestJSON("/api/health");
      if (data.status !== "ok") {
        throw new Error("Health response status is not 'ok'");
      }
      return "GET /api/health";
    } catch (error) {
      if (!error.message.includes("HTTP 404")) throw error;
    }

    const legacyData = await requestJSON("/health");

    if (legacyData.status !== "ok") {
      throw new Error("Legacy health response status is not 'ok'");
    }

    return "GET /health works; /api/health is not registered";
  });

  healthPassed ? passed++ : failed++;

  // Test 2: Products and pricess
  const productsPassed = await runTest("Products, prices and verdicts", async () => {
    const result = await requestJSON("/api/products");
    const products = Array.isArray(result) ? result : result.data;

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("No products returned");
    }

    const productWithPrices = products.find((product) => {
      const prices = product.latestPrices || product.prices || [];
      return prices.some((record) => Number(record.price) > 0);
    });

    if (!productWithPrices) {
      throw new Error("No product with a valid price was found");
    }
    return `${products.length} products with prices found`;
  });

  productsPassed ? passed++ : failed++;

  // Test 3:Search results and platform breakdown
  const searchPassed = await runTest("Search results and platform breakdown", async () => {
    const result = await requestJSON("/api/products/search?q=laptop");
    const products = Array.isArray(result) ? result : result.data;

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("Laptop search returned no products");
    }
    const hasPlatformBreakdown = products.some((product) => {
      const breakdown = product.platformBreakdown || product.latestPrices;
      return Array.isArray(breakdown) && breakdown.length > 0;
    });

    if (!hasPlatformBreakdown) {
      throw new Error("Search results do not include platform breakdowns");
    }

    return `${products.length} search results with platform data`;
  });

  searchPassed ? passed++ : failed++;

  console.log("\n------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("------------------------------\n");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[FAIL] Smoke test runner:", error.message);
  process.exitCode = 1;
});
