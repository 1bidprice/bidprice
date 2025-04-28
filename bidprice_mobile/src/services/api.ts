import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginCredentials, RegisterData, User, Product, Bid } from '../types';

const API_URL = 'https://online-auction-app-tunnel-7twehmg9.devinapps.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    
    const username = 'devin'; // Use the actual username
    const password = 'integration'; // Use the actual password
    const basicAuth = btoa(`${username}:${password}`);
    config.headers.Authorization = `Basic ${basicAuth}`;
    
    if (token && config.url && !config.url.includes('online-auction-app')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const username = 'devin'; // Use the actual username
    const password = 'integration'; // Use the actual password
    const basicAuth = btoa(`${username}:${password}`);
    
    const response = await api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
    });
    return response.data;
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
};

export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products/');
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post<Product>('/products/', data);
    return response.data;
  },

  getUserProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products/my-products');
    return response.data;
  },
};

export const bidApi = {
  placeBid: async (productId: string, amount: number): Promise<Bid> => {
    const response = await api.post<Bid>(`/bids/${productId}`, { amount });
    return response.data;
  },

  getProductBids: async (productId: string): Promise<Bid[]> => {
    const response = await api.get<Bid[]>(`/bids/product/${productId}`);
    return response.data;
  },

  getUserBids: async (): Promise<Bid[]> => {
    const response = await api.get<Bid[]>('/bids/my-bids');
    return response.data;
  },
};

export default api;
