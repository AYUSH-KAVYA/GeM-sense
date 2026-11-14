import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes.js";

// ── Load environment variables ───────────────────────────────────────
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS Configuration for Production & Development ──────────────────
const isAllowedOrigin = (origin) => {
  // Allow requests with no origin (mobile apps, curl, server-to-server)
  if (!origin) return true;

  if (process.env.CORS_ORIGIN === "*") return true;

  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
    return true;
  }

  // Local development ports
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000") {
    return true;
  }

  // Vercel production and preview deployments (*.vercel.app)
  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".vercel.app") || hostname === "localhost") {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────
// Mount product comparison and search routes
app.use("/api/products", productRoutes);

// Root information endpoint for Cloud Deployment (Render/Railway)
app.get("/", (_req, res) => {
  res.json({
    service: "GeM Price Comparison API",
    status: "running",
    docs: "/api/products",
  });
});

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

// ── 404 Handler for Unknown Routes ───────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// ── Global Error Handler Middleware ──────────────────────────────────
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

// ── Start Server (Bound to 0.0.0.0 for Cloud Container Hosts) ────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 GeM-sense Backend running on http://0.0.0.0:${PORT}`);
  console.log(`   ├─ Health:   http://0.0.0.0:${PORT}/api/health`);
  console.log(`   ├─ Products: http://0.0.0.0:${PORT}/api/products`);
  console.log(`   ├─ Search:   http://0.0.0.0:${PORT}/api/products/search?q=printer`);
  console.log(`   ├─ History:  http://0.0.0.0:${PORT}/api/products/1/history`);
  console.log(`   └─ Refresh:  POST http://0.0.0.0:${PORT}/api/products/1/refresh\n`);
});

export default app;
