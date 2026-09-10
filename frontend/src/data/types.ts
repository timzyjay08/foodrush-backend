export type Role = "customer" | "restaurant" | "rider" | "admin";

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
};

export type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  imageUrl: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  deliveryMinutes: [number, number];
  deliveryFee: number;
  minOrder: number;
  distanceKm: number;
  area: string;
  isOpen: boolean;
  promo?: string;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  section: string;
  tags?: string[];
  popular?: boolean;
  spicy?: boolean;
};

export type CartLine = {
  menuItemId: string;
  restaurantId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  note?: string;
};

export type PaymentMethod = "card" | "transfer" | "cash";

export type OrderStatus =
  "pending" | "confirmed" | "preparing" | "on_the_way" | "delivered" | "cancelled";

export type Order = {
  id: string;
  reference: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  status: OrderStatus;
  placedAt: string;
  etaMinutes: number;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  address: string;
  paymentMethod?: PaymentMethod;
  rider?: { name: string; phone: string; vehicle: string };
};

export type Address = {
  id: string;
  label: string;
  street: string;
  area: string;
  city: string;
  instructions?: string;
  isDefault?: boolean;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
};
