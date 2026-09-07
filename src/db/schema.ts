import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  pgEnum,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const roleEnum = pgEnum("role", [
  "customer",
  "restaurant",
  "rider",
  "admin",
  "learner",
  "mentor",
]);
export type Role = (typeof roleEnum.enumValues)[number];

// Single shared status system (must match the frontend exactly).
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "restaurant_accepted",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
]);
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
]);
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export const riderStatusEnum = pgEnum("rider_status", [
  "offline",
  "available",
  "on_delivery",
]);
export type RiderStatus = (typeof riderStatusEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Users (customers, restaurant owners, riders, admins)
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("customer"),
  isSuspended: boolean("is_suspended").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// Restaurants
// ---------------------------------------------------------------------------
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  cuisine: text("cuisine").notNull(),
  imageUrl: text("image_url"),
  coverImageUrl: text("cover_image_url"),
  address: text("address").notNull(),
  city: text("city").notNull().default("Lagos"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  phone: text("phone"),
  rating: doublePrecision("rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  deliveryFee: doublePrecision("delivery_fee").notNull().default(500),
  deliveryTimeMinutes: integer("delivery_time_minutes").notNull().default(30),
  minimumOrder: doublePrecision("minimum_order").notNull().default(0),
  isOpen: boolean("is_open").notNull().default(true),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;

// ---------------------------------------------------------------------------
// Menu items + customization options
// ---------------------------------------------------------------------------
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  category: text("category"),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export const foodItemOptions = pgTable("food_item_options", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
});

export type FoodItemOption = typeof foodItemOptions.$inferSelect;

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label"),
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  deliveryInstructions: text("delivery_instructions"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

// ---------------------------------------------------------------------------
// Cart + cart items (one active cart per user, single restaurant per cart)
// ---------------------------------------------------------------------------
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  restaurantId: integer("restaurant_id").references(() => restaurants.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Cart = typeof carts.$inferSelect;

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  options: jsonb("options").$type<{ name: string; price: number }[]>().notNull().default([]),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type CartItem = typeof cartItems.$inferSelect;

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "restrict" }),
  riderId: integer("rider_id").references(() => users.id, { onDelete: "set null" }),
  status: orderStatusEnum("status").notNull().default("pending_payment"),
  subtotal: doublePrecision("subtotal").notNull().default(0),
  deliveryFee: doublePrecision("delivery_fee").notNull().default(0),
  serviceFee: doublePrecision("service_fee").notNull().default(0),
  discount: doublePrecision("discount").notNull().default(0),
  total: doublePrecision("total").notNull().default(0),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryDistanceKm: doublePrecision("delivery_distance_km").notNull().default(0),
  note: text("note"),
  paymentMethod: text("payment_method").notNull().default("card"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").references(() => menuItems.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  options: jsonb("options").$type<{ name: string; price: number }[]>().notNull().default([]),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ---------------------------------------------------------------------------
// Payments (Paystack)
// ---------------------------------------------------------------------------
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  reference: text("reference").notNull().unique(),
  amount: doublePrecision("amount").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  provider: text("provider").notNull().default("paystack"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  refundReference: text("refund_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Payment = typeof payments.$inferSelect;

// ---------------------------------------------------------------------------
// Delivery riders + deliveries
// ---------------------------------------------------------------------------
export const deliveryRiders = pgTable("delivery_riders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isOnline: boolean("is_online").notNull().default(false),
  status: riderStatusEnum("status").notNull().default("offline"),
  vehicle: text("vehicle").notNull().default("Motorcycle"),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  totalEarnings: doublePrecision("total_earnings").notNull().default(0),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type DeliveryRider = typeof deliveryRiders.$inferSelect;

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  riderId: integer("rider_id").references(() => users.id, { onDelete: "set null" }),
  distanceKm: doublePrecision("distance_km").notNull().default(0),
  earnings: doublePrecision("earnings").notNull().default(0),
  pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Delivery = typeof deliveries.$inferSelect;

// ---------------------------------------------------------------------------
// Reviews (restaurants and riders)
// ---------------------------------------------------------------------------
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  restaurantId: integer("restaurant_id").references(() => restaurants.id, {
    onDelete: "cascade",
  }),
  riderId: integer("rider_id").references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("favorites_user_restaurant_idx").on(t.userId, t.restaurantId),
  }),
);

export type Favorite = typeof favorites.$inferSelect;

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percentage"), // percentage | fixed
  discountValue: doublePrecision("discount_value").notNull(),
  maxUses: integer("max_uses").notNull().default(100),
  timesUsed: integer("times_used").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Coupon = typeof coupons.$inferSelect;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("info"),
  title: text("title").notNull(),
  body: text("body"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;

// ---------------------------------------------------------------------------
// Order status history (audit trail of every transition)
// ---------------------------------------------------------------------------
export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: orderStatusEnum("from_status"),
  toStatus: orderStatusEnum("to_status").notNull(),
  actorId: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;

// ---------------------------------------------------------------------------
// Driver GPS locations (latest position per driver, upserted)
// ---------------------------------------------------------------------------
export const driverLocations = pgTable(
  "driver_locations",
  {
    id: serial("id").primaryKey(),
    driverId: integer("driver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("driver_locations_driver_idx").on(t.driverId),
  }),
);

export type DriverLocation = typeof driverLocations.$inferSelect;

// ---------------------------------------------------------------------------
// Audit logs (who did what, when)
// ---------------------------------------------------------------------------
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// ---------------------------------------------------------------------------
// Support tickets + messages
// ---------------------------------------------------------------------------
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  category: text("category").notNull().default("general"),
  status: text("status").notNull().default("open"), // open | in_progress | resolved | closed
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
