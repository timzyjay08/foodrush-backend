/**
 * Repository contracts (interfaces) for the food delivery platform.
 *
 * Controllers depend on services, and services depend on these interfaces —
 * never on a concrete database implementation. Concrete implementations live
 * in `src/repositories/pg/` and use raw SQL (no ORM). This lets any data
 * source (PostgreSQL today, another store tomorrow) be swapped behind the
 * same contract.
 */

export type Role = "customer" | "restaurant" | "rider" | "admin" | "learner" | "mentor";
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "restaurant_accepted"
  | "preparing"
  | "ready_for_pickup"
  | "rider_assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

// ---- Domain entities (camelCase, as exposed to services/controllers) ----

export interface UserEntity {
  id: number;
  name: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  avatarUrl: string | null;
  phone: string | null;
  role: Role;
  isSuspended: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface RestaurantEntity {
  id: number;
  ownerId: number | null;
  name: string;
  slug: string | null;
  description: string | null;
  cuisine: string;
  imageUrl: string | null;
  coverImageUrl: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  rating: number;
  ratingCount: number;
  deliveryFee: number;
  deliveryTimeMinutes: number;
  minimumOrder: number;
  isOpen: boolean;
  isApproved: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MenuItemEntity {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface FoodOptionEntity {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface OrderEntity {
  id: number;
  userId: number;
  restaurantId: number;
  riderId: number | null;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  deliveryAddress: string;
  deliveryDistanceKm: number;
  note: string | null;
  paymentMethod: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface OrderItemEntity {
  id: number;
  orderId: number;
  menuItemId: number | null;
  name: string;
  price: number;
  quantity: number;
  options: { name: string; price: number }[];
  specialInstructions: string | null;
}

export interface CartEntity {
  id: number;
  userId: number;
  restaurantId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CartItemEntity {
  id: number;
  cartId: number;
  menuItemId: number;
  quantity: number;
  options: { name: string; price: number }[];
  specialInstructions: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RestaurantFilter {
  q?: string;
  cuisine?: string;
  city?: string;
  open?: boolean;
  sort?: string;
  page: number;
  limit: number;
}

export interface NewUserInput {
  name: string;
  email: string;
  passwordHash: string | null;
  phone?: string | null;
  role: Role;
  googleId?: string | null;
  avatarUrl?: string | null;
}

export interface NewRestaurantInput {
  ownerId: number;
  name: string;
  description?: string | null;
  cuisine: string;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  address: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  deliveryTimeMinutes?: number;
  minimumOrder?: number;
  isOpen?: boolean;
  isApproved?: boolean;
}

export interface NewOrderInput {
  userId: number;
  restaurantId: number;
  riderId?: number | null;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  deliveryAddress: string;
  deliveryDistanceKm: number;
  note?: string | null;
  paymentMethod?: string;
}

export interface NewOrderItemInput {
  menuItemId: number | null;
  name: string;
  price: number;
  quantity: number;
  options: { name: string; price: number }[];
  specialInstructions?: string | null;
}

// ---- Repository contracts ----

export interface UserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(input: NewUserInput): Promise<UserEntity>;
  update(id: number, patch: Partial<UserEntity>): Promise<UserEntity | null>;
}

export interface RestaurantRepository {
  findById(id: number): Promise<RestaurantEntity | null>;
  list(filter: RestaurantFilter): Promise<PaginatedResult<RestaurantEntity>>;
  create(input: NewRestaurantInput): Promise<RestaurantEntity>;
  update(id: number, patch: Partial<RestaurantEntity>): Promise<RestaurantEntity | null>;
  remove(id: number): Promise<boolean>;
  findByOwner(ownerId: number): Promise<RestaurantEntity[]>;
}

export interface MenuRepository {
  findByRestaurant(restaurantId: number): Promise<MenuItemEntity[]>;
  findById(id: number): Promise<MenuItemEntity | null>;
  create(input: { restaurantId: number; name: string; description?: string | null; price: number; category?: string | null; imageUrl?: string | null; isAvailable?: boolean }): Promise<MenuItemEntity>;
  update(id: number, patch: Partial<MenuItemEntity>): Promise<MenuItemEntity | null>;
  remove(id: number): Promise<boolean>;
  optionsForItems(itemIds: number[]): Promise<FoodOptionEntity[]>;
}

export interface OrderRepository {
  create(input: NewOrderInput, items: NewOrderItemInput[]): Promise<OrderEntity>;
  findById(id: number): Promise<OrderEntity | null>;
  itemsForOrder(orderId: number): Promise<OrderItemEntity[]>;
  listByUser(userId: number, status?: OrderStatus): Promise<OrderEntity[]>;
  listByRider(riderId: number, status?: OrderStatus): Promise<OrderEntity[]>;
  listByRestaurants(restaurantIds: number[], status?: OrderStatus): Promise<OrderEntity[]>;
  listAll(status?: OrderStatus): Promise<OrderEntity[]>;
  updateStatus(id: number, status: OrderStatus): Promise<OrderEntity | null>;
  assignRider(id: number, riderId: number, status: OrderStatus): Promise<OrderEntity | null>;
}
