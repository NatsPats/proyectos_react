import axios from 'axios';

const api = axios.create({
  baseURL: 'https://fakestoreapi.com',
  timeout: 10000,
});

export const getProducts = (category) => {
  if (category) {
    return api.get(`/products/category/${encodeURIComponent(category)}`).then((r) => r.data);
  }
  return api.get('/products').then((r) => r.data);
};

export const getProductById = (id) => api.get(`/products/${id}`).then((r) => r.data);

export default api;
