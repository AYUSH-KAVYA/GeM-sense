import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Fetch all tracked products with latest platform prices
 * @returns {Promise<object>} API response containing array of products
 */
export const fetchProducts = async () => {
  try {
    const response = await apiClient.get('/products');
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    throw error;
  }
};

/**
 * Search products by keyword query (?q=...)
 * @param {string} query - Keyword search term
 * @returns {Promise<object>} API response containing search results
 */
export const searchProducts = async (query) => {
  try {
    const response = await apiClient.get('/products/search', {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error searching products for "${query}":`, error);
    throw error;
  }
};

/**
 * Fetch a single product with full historical price records for charts
 * @param {string|number} id - Product ID
 * @returns {Promise<object>} API response containing product & price history
 */
export const fetchProductById = async (id) => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching product #${id}:`, error);
    throw error;
  }
};

export default {
  fetchProducts,
  searchProducts,
  fetchProductById,
};
