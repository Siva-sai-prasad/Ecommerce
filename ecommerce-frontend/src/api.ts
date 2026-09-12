export const API_BASE_URL = '/api';

export type OrderItem = {
  id?: number | null;
  productId?: number | null;
  productName?: string | null;
  quantity: number;
  price: number;
};

export type OrderResponse = {
  id: number;
  userEmail: string;
  status: string;
  total: number;
  items: OrderItem[];
};

export type OrdersPage = {
  content: OrderResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function fetchOrdersPage(page = 0, size = 10): Promise<OrdersPage> {
  const response = await fetch(`${API_BASE_URL}/orders?page=${page}&size=${size}&sort=createdAt,desc`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`);
  }

  return response.json();
}
