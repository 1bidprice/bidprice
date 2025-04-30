export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  is_admin: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  seller_id: string;
  auction_end_date: string;
  created_at: string;
  is_active: boolean;
  current_highest_bid: number | null;
  current_highest_bidder_id: string | null;
  image_url: string | null;
}

export interface Bid {
  id: string;
  amount: number;
  bidder_id: string;
  product_id: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface ProductFormData {
  title: string;
  description: string;
  starting_price: number;
  auction_end_date: string;
  image_url?: string;
}

export interface ImageUploadResponse {
  filename: string;
  file_path: string;
}

export interface Transaction {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_processor: string;
  transaction_fee: number;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentFormData {
  product_id: string;
  payment_method: string;
}
