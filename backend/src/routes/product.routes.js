import { Router } from "express";
import {
  getAllProducts,
  searchProducts,
  getProductById,
} from "../controllers/product.controller.js";

const router = Router();

// GET /api/products          — list all tracked products with latest prices
router.get("/", getAllProducts);

// GET /api/products/search   — search by keyword (?q=printer)
router.get("/search", searchProducts);

// GET /api/products/:id      — single product with full price history
router.get("/:id", getProductById);

export default router;
