
// Core data types for FeedFortune platform

export type UserRole = 'farmer' | 'agent' | 'supplier' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  location: string;
  language: 'en' | 'rw' | 'fr';
  isVerified: boolean;
  verificationDate?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  businessRegistrationNumber: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  supplierId: string;
  category: string;
  name: string;
  description: string;
  unitPrice: number;
  discountAvailable: number;
  nutritionalContent: string;
  imageUrl?: string;
  barcode?: string;
  feedType: 'aquaculture' | 'livestock' | 'poultry' | 'mixed';
  availabilityStatus: 'available' | 'limited' | 'out_of_stock';
  stockQuantity: number;
  unit: 'kg' | 'tons' | 'bags';
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  bankAccountNumber?: string;
  cooperativeAssociation?: string;
  isVerified: boolean;
  agentId?: string;
  createdAt: string;
}

export interface Farm {
  id: string;
  farmerId: string;
  name: string;
  location: string;
  size: number; // in hectares or acres
  livestockType: string;
  details?: string;
  createdAt: string;
}

export interface Inventory {
  id: string;
  farmId: string;
  productId: string;
  currentStock: number;
  averageMonthlyConsumption: number;
  lastOrderDate?: string;
  feedFrequency: number; // times per day/week
  feedFrequencyUnit: 'daily' | 'weekly';
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  lowStockAlert: boolean;
}

export interface Agent {
  id: string;
  name: string;
  region: string;
  address: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  farmerId: string;
  agentId?: string;
  supplierId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalPrice: number;
  totalQuantity: number;
  discount: number;
  paymentDate?: string;
  deliveryAddress: string;
  deliveryDate?: string;
  transactionReference?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  deliveryDate?: string;
}

export interface Loan {
  id: string;
  farmerId: string;
  orderId?: string;
  amount: number;
  terms: number; // in months
  repaymentSchedule: string;
  outstandingBalance: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'overdue' | 'defaulted';
  createdAt: string;
  dueDate: string;
}

export interface Payment {
  id: string;
  orderId: string;
  farmerId: string;
  amount: number;
  date: string;
  method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeSuppliers: number;
  activeFarmers: number;
  lowStockAlerts: number;
  pendingPayments: number;
  overdueLoans: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'order' | 'payment' | 'inventory' | 'loan' | 'registration';
  description: string;
  timestamp: string;
  userId: string;
  userRole: UserRole;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
