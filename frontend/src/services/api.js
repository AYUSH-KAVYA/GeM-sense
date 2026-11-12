import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchProducts() {
  const { data } = await api.get('/products');
  return Array.isArray(data) ? data : (data?.products ?? []);
}

export async function searchProducts(query) {
  const { data } = await api.get('/products/search', { params: { q: query } });
  return Array.isArray(data) ? data : (data?.products ?? []);
}

export async function fetchProductById(id) {
  const { data } = await api.get(`/products/${encodeURIComponent(id)}`);
  return data?.product ?? data;
}

export default api;
