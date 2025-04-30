import { AuthResponse, LoginCredentials, RegisterCredentials, User, Product, Bid, ProductFormData, ImageUploadResponse, Transaction, PaymentFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Something went wrong');
  }
  
  return response.json();
}

export const authApi = {
  register: (data: RegisterCredentials): Promise<User> => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  login: async (data: LoginCredentials): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    
    const isDeployedBackend = API_URL.includes('online-auction-app');
    
    if (isDeployedBackend) {
      const username = 'devin'; // Use the actual username
      const password = 'integration'; // Use the actual password
      const basicAuth = btoa(`${username}:${password}`);
      headers['Authorization'] = `Basic ${basicAuth}`;
    }
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Login failed');
    }
    
    return response.json();
  },
  
  getCurrentUser: (): Promise<User> => {
    return fetchWithAuth('/users/me');
  },
};

export const productsApi = {
  getAll: (): Promise<Product[]> => {
    return fetchWithAuth('/products/');
  },
  
  getById: (id: string): Promise<Product> => {
    return fetchWithAuth(`/products/${id}`);
  },
  
  create: (data: ProductFormData): Promise<Product> => {
    return fetchWithAuth('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: (id: string, data: ProductFormData): Promise<Product> => {
    return fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: (id: string): Promise<void> => {
    return fetchWithAuth(`/products/${id}`, {
      method: 'DELETE',
    });
  },
  
  getUserProducts: (userId: string): Promise<Product[]> => {
    return fetchWithAuth(`/users/${userId}/products`);
  },
  
  uploadImage: async (file: File): Promise<ImageUploadResponse> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: Record<string, string> = {};
    
    const isDeployedBackend = API_URL.includes('online-auction-app');
    
    if (isDeployedBackend) {
      const username = 'devin';
      const password = 'integration';
      const basicAuth = btoa(`${username}:${password}`);
      headers['Authorization'] = `Basic ${basicAuth}`;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/products/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to upload image');
    }
    
    return response.json();
  },
};

export const bidsApi = {
  getForProduct: (productId: string): Promise<Bid[]> => {
    return fetchWithAuth(`/bids/products/${productId}/bids`);
  },
  
  create: (productId: string, amount: number): Promise<Bid> => {
    return fetchWithAuth(`/bids/products/${productId}/bids`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        product_id: productId,
      }),
    });
  },
  
  getUserBids: (userId: string): Promise<Bid[]> => {
    return fetchWithAuth(`/users/${userId}/bids`);
  },
};

export const adminApi = {
  getAllUsers: (): Promise<User[]> => {
    return fetchWithAuth('/users/');
  },
  
  getAllBids: (): Promise<Bid[]> => {
    return fetchWithAuth('/bids/');
  },
};

export const paymentsApi = {
  create: (paymentData: PaymentFormData): Promise<Transaction> => {
    return fetchWithAuth('/payments/create', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
  
  getUserPurchases: (): Promise<Transaction[]> => {
    return fetchWithAuth('/payments/user/purchases');
  },
  
  getUserSales: (): Promise<Transaction[]> => {
    return fetchWithAuth('/payments/user/sales');
  },
  
  completePayment: (transactionId: string): Promise<Transaction> => {
    return fetchWithAuth(`/payments/${transactionId}/complete`, {
      method: 'PUT',
    });
  },
  
  getTransaction: (transactionId: string): Promise<Transaction> => {
    return fetchWithAuth(`/payments/${transactionId}`);
  },
};
