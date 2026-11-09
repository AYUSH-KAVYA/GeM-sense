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
app.use("/api/products", productRoutes);

// Health-check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "GeM-sense Backend API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root info
app.get("/", (_req, res) => {
  res.json({
    message: "GeM-sense API is running",
    endpoints: {
      health: "/health",
      allProducts: "/api/products",
      search: "/api/products/search?q={query}",
      productById: "/api/products/:id",
    },
  });
});

// ── 404 handler ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// ── Global error handler ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ── Start server ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 GeM-sense Backend running on http://localhost:${PORT}`);
  console.log(`   ├─ Health:   http://localhost:${PORT}/health`);
  console.log(`   ├─ Products: http://localhost:${PORT}/api/products`);
  console.log(`   ├─ Search:   http://localhost:${PORT}/api/products/search?q=printer`);
  console.log(`   └─ By ID:    http://localhost:${PORT}/api/products/1\n`);
});

export default app;
