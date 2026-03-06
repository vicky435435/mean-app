// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  _id?: string;
  name: string;
  price: number;
  description: string;
  category?: string;
  stock?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: User;
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string | Product;
  quantity: number;
  priceAtOrder: number;
}

export interface Order {
  _id?: string;
  orderId?: string;
  userId: number;
  productIds: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderDto {
  productIds: { productId: string; quantity: number }[];
  shippingAddress?: string;
  notes?: string;
}

// ─── Weather ──────────────────────────────────────────────────────────────────
export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  pressure: number;
  visibility: number;
  fetchedAt: string;
}

export interface ForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
}

export interface ForecastData {
  city: string;
  forecast: ForecastDay[];
}

// ─── Generic API Response ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { msg: string; path: string }[];
}
