import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(["customer", "restaurant", "rider", "learner", "mentor"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).nullish(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(["customer", "restaurant", "rider", "admin", "learner", "mentor"]).optional(),
  isSuspended: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Restaurants
// ---------------------------------------------------------------------------
export const createRestaurantSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  cuisine: z.string().trim().min(1).max(80),
  imageUrl: z.string().trim().max(500).optional(),
  coverImageUrl: z.string().trim().max(500).optional(),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().trim().max(30).optional(),
  deliveryTimeMinutes: z.number().int().min(5).max(240).optional(),
  minimumOrder: z.number().min(0).optional(),
  isOpen: z.boolean().optional(),
});

export const updateRestaurantSchema = createRestaurantSchema
  .extend({ isApproved: z.boolean().optional() })
  .partial();

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------
export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional(),
  price: z.number().positive().max(1000000),
  discountPrice: z.number().positive().max(1000000).optional(),
  category: z.string().trim().max(80).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  preparationTime: z.number().int().min(1).max(180).optional(),
  isAvailable: z.boolean().optional(),
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        price: z.number().min(0).max(1000000),
      }),
    )
    .max(20)
    .optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export const addCartItemSchema = z.object({
  menuItemId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(50).default(1),
  optionIds: z.array(z.number().int().positive()).max(20).optional(),
  specialInstructions: z.string().trim().max(500).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(50).optional(),
  specialInstructions: z.string().trim().max(500).nullish(),
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export const createOrderSchema = z.object({
  restaurantId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(50),
        optionIds: z.array(z.number().int().positive()).max(20).optional(),
        specialInstructions: z.string().trim().max(500).optional(),
      }),
    )
    .min(1)
    .max(100),
  deliveryAddress: z.string().trim().min(5).max(500),
  deliveryLatitude: z.number().min(-90).max(90).optional(),
  deliveryLongitude: z.number().min(-180).max(180).optional(),
  note: z.string().trim().max(1000).optional(),
  deliveryDistanceKm: z.number().min(0).max(100).optional(),
  couponCode: z.string().trim().max(50).optional(),
  paymentMethod: z.enum(["card", "cash", "transfer", "bank"]).optional(),
});

export const orderStatusValues = [
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
] as const;

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues),
});

export const assignRiderSchema = z.object({
  riderId: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  restaurantId: z.number().int().positive().optional(),
  riderId: z.number().int().positive().optional(),
  orderId: z.number().int().positive().optional(),
});

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
export const createAddressSchema = z.object({
  label: z.string().trim().max(80).optional(),
  street: z.string().trim().min(3).max(300),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  zip: z.string().trim().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export const initializePaymentSchema = z.object({
  orderId: z.number().int().positive(),
});

export const verifyPaymentSchema = z.object({
  reference: z.string().trim().min(1).max(200),
});

// ---------------------------------------------------------------------------
// Riders / Drivers
// ---------------------------------------------------------------------------
export const updateRiderSchema = z.object({
  vehicle: z.string().trim().max(80).optional(),
  isOnline: z.boolean().optional(),
});

export const updateDriverLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(50).transform((s) => s.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0).max(1000000),
  maxUses: z.number().int().min(1).max(100000).optional(),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  restaurantId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().trim().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1).max(50),
  restaurantId: z.number().int().positive().optional(),
  subtotal: z.number().min(0),
});

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------
export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z
    .enum(["missing_food", "wrong_food", "late_delivery", "payment", "driver", "restaurant", "general"])
    .optional(),
  body: z.string().trim().min(1).max(2000),
  orderId: z.number().int().positive().optional(),
});

export const addTicketMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});
