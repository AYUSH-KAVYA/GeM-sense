import { Router } from "express";
import {
  getAllProducts,
  searchProducts,
  getProductHistory,
  refreshProductPrice,
} from "../controllers/product.controller.js";

const router = Router();

// GET /api/products          — list all tracked products with latest prices and verdicts
router.get("/", getAllProducts);

// GET /api/products/search   — keyword or GeM URL search with cache and live fallback
router.get("/search", searchProducts);

// GET /api/products/:id/history — product detail with time-series chart data
router.get("/:id/history", getProductHistory);

// POST /api/products/:id/refresh — bypass cache, trigger fresh scrape, persist new PriceRecords
router.post("/:id/refresh", refreshProductPrice);

// GET /api/products/:id      — single product detail with full price history
router.get("/:id", getProductHistory);

export default router;
