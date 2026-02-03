
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED'
}

export interface Product {
  id: string;
  name: string;
  unit: string;
}

export interface DefaultItem {
  productId: string;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  deliveryTime: string;
  defaultItems: DefaultItem[]; // 儲存產品 ID 與 預設數量
  offDays: number[]; // 0-6 (Sun-Sat) - 週期性公休
  holidayDates: string[]; // ['2026-01-20', ...] - 特定日期公休
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  deliveryDate: string;
  deliveryTime: string;
  items: OrderItem[];
  note: string;
  status: OrderStatus;
}

export interface GASResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
