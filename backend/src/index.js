import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes.js";

// ── Load environment variables ───────────────────────────────────────
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────
// Mount product comparison and search routes
app.use("/api/products", productRoutes);

// Health check endpoints (/api/health and /health)
const handleHealth = (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

app.get("/api/health", handleHealth);
app.get("/health", handleHealth);

// Root information endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "GeM-sense API is running",
    endpoints: {
      health: "/api/health",
      allProducts: "/api/products",
      search: "/api/products/search?q={query}",
      productHistory: "/api/products/:id/history",
      refreshPrice: "POST /api/products/:id/refresh",
    },
  });
});

// ── 404 Handler ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// ── Global Error Handler ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ── Start Server ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 GeM-sense Backend running on http://localhost:${PORT}`);
  console.log(`   ├─ Health:   http://localhost:${PORT}/api/health`);
  console.log(`   ├─ Products: http://localhost:${PORT}/api/products`);
  console.log(`   ├─ Search:   http://localhost:${PORT}/api/products/search?q=printer`);
  console.log(`   ├─ History:  http://localhost:${PORT}/api/products/1/history`);
  console.log(`   └─ Refresh:  POST http://localhost:${PORT}/api/products/1/refresh\n`);
});

export default app;
