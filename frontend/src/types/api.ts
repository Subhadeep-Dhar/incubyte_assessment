export const VEHICLE_CATEGORIES = [
  'Sedan',
  'SUV',
  'Truck',
  'Coupe',
  'Hatchback',
  'EV',
  'Convertible',
  'Van',
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  category: VehicleCategory;
  price: number;
  quantityInStock: number;
  year?: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'customer' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseVehicleSnapshot {
  make: string;
  model: string;
  year?: number;
  category: VehicleCategory | string;
  imageUrl?: string;
  description?: string;
}

export interface Purchase {
  _id: string;
  userId: string;
  vehicleId: string | Vehicle;
  vehicleDetails?: PurchaseVehicleSnapshot;
  priceAtPurchase: number;
  quantity?: number;
  purchasedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination?: Pagination;
  meta?: Pagination;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}
