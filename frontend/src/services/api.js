import axios from 'axios';

// In packaged Electron desktop app (file:// protocol), connect directly to the live Render backend.
// In browser environments (web/Vercel), respect VITE_API_URL or fall back to Render.
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const API_BASE_URL = isFileProtocol
  ? 'https://gem-compare-api.onrender.com/api'
  : (import.meta.env.VITE_API_URL || 'https://gem-compare-api.onrender.com/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const fetchProducts = async () => {
  try {
    const response = await apiClient.get('/products');
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    throw error;
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await apiClient.get('/products/search', { params: { q: query } });
    return response.data;
  } catch (error) {
    console.error(`[API] Error searching products for "${query}":`, error);
    throw error;
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching product #${id}:`, error);
    throw error;
  }
};

export const fetchProductHistory = async (productId) => {
  try {
    const response = await apiClient.get(`/products/${productId}/history`);
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching history for product #${productId}:`, error);
    throw error;
  }
};

export const refreshProductPrice = async (productId) => {
  try {
    const response = await apiClient.post(`/products/${productId}/refresh`);
    return response.data;
  } catch (error) {
    console.error(`[API] Error refreshing prices for product #${productId}:`, error);
    throw error;
  }
};

export default { fetchProducts, searchProducts, fetchProductById, fetchProductHistory, refreshProductPrice };
