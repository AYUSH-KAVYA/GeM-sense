import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
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
