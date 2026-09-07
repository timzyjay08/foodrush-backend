import { menuRepository, orderRepository, restaurantRepository } from "@/repositories";
import type {
  NewOrderItemInput,
  OrderEntity,
  OrderRepository,
  OrderStatus,
  RestaurantEntity,
  RestaurantRepository,
  MenuRepository,
} from "@/repositories/contracts";
import { query, queryOne } from "@/db/raw";
import { ApiError, calcDeliveryFee, calcServiceFee, round2 } from "@/lib/http";
import type { UserEntity } from "@/repositories/contracts";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["restaurant_accepted", "cancelled"],
  restaurant_accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["rider_assigned", "cancelled"],
  rider_assigned: ["picked_up", "cancelled"],
  picked_up: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: ["refunded"],
  refunded: [],
};

interface OrderLine {
  menuItemId: number;
  quantity: number;
  optionIds?: number[];
  specialInstructions?: string;
}

export class OrderService {
  constructor(
    private readonly orders: OrderRepository = orderRepository,
    private readonly restaurants: RestaurantRepository = restaurantRepository,
    private readonly menu: MenuRepository = menuRepository,
  ) {}

  async list(actor: UserEntity, status?: string): Promise<OrderEntity[]> {
    const filter = this.parseStatus(status);
    if (filter === null) throw new ApiError(400, "Invalid order status", "INVALID_STATUS");
    switch (actor.role) {
      case "admin":
        return this.orders.listAll(filter);
      case "customer":
        return this.orders.listByUser(actor.id, filter);
      case "rider":
        return this.orders.listByRider(actor.id, filter);
      case "restaurant": {
        const owned = await this.restaurants.findByOwner(actor.id);
        return this.orders.listByRestaurants(owned.map((r) => r.id), filter);
      }
      default:
        return [];
    }
  }

  async get(actor: UserEntity, orderId: number) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");
    this.assertCanView(actor, order);
    const items = await this.orders.itemsForOrder(orderId);
    return { order, items };
  }

  async create(actor: UserEntity, input: {
    restaurantId: number;
    items: OrderLine[];
    deliveryAddress: string;
    note?: string;
    deliveryDistanceKm?: number;
    couponCode?: string;
    paymentMethod?: string;
  }): Promise<{ order: OrderEntity; items: unknown[]; coupon: { code: string; discount: number } | null }> {
    if (actor.role !== "customer" && actor.role !== "admin") {
      throw new ApiError(403, "Only customers can place orders", "FORBIDDEN");
    }

    const restaurant = await this.restaurants.findById(input.restaurantId);
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");
    if (!restaurant.isApproved) throw new ApiError(403, "This restaurant is not approved", "NOT_APPROVED");
    if (!restaurant.isOpen) throw new ApiError(409, "This restaurant is currently closed", "RESTAURANT_CLOSED");

    const menu = await this.menu.findByRestaurant(restaurant.id);
    const byId = new Map(menu.map((m) => [m.id, m]));

    const optionRows = await this.menu.optionsForItems(menu.map((m) => m.id));
    const optionsByItem = new Map<number, { id: number; name: string; price: number }[]>();
    for (const o of optionRows) {
      const arr = optionsByItem.get(o.menuItemId) ?? [];
      arr.push(o);
      optionsByItem.set(o.menuItemId, arr);
    }

    let subtotal = 0;
    const lines: NewOrderItemInput[] = input.items.map((line) => {
      const item = byId.get(line.menuItemId);
      if (!item || item.restaurantId !== restaurant.id) {
        throw new ApiError(400, `Menu item #${line.menuItemId} does not belong to this restaurant`, "INVALID_ITEM");
      }
      if (!item.isAvailable) throw new ApiError(409, `"${item.name}" is currently unavailable`, "ITEM_UNAVAILABLE");

      const selected = new Set(line.optionIds ?? []);
      const options = (optionsByItem.get(item.id) ?? [])
        .filter((o) => selected.has(o.id))
        .map((o) => ({ name: o.name, price: o.price }));

      const unit = round2(item.price + options.reduce((a, o) => a + o.price, 0));
      subtotal += unit * line.quantity;
      return {
        menuItemId: item.id,
        name: item.name,
        price: unit,
        quantity: line.quantity,
        options,
        specialInstructions: line.specialInstructions,
      };
    });

    const subtotalRounded = round2(subtotal);
    const distanceKm = input.deliveryDistanceKm ?? 3;
    const deliveryFee = calcDeliveryFee(distanceKm);
    const serviceFee = calcServiceFee(subtotalRounded);

    // Coupon (raw query, server-authoritative).
    let discount = 0;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const coupon = await queryOne<{ id: number; code: string; discount_type: string; discount_value: number; max_uses: number; times_used: number; is_active: boolean; expires_at: Date | null }>(
        `SELECT id, code, discount_type, discount_value, max_uses, times_used, is_active, expires_at FROM coupons WHERE code = $1`,
        [input.couponCode.toUpperCase()],
      );
      if (!coupon || !coupon.is_active || (coupon.expires_at && coupon.expires_at < new Date()) || coupon.times_used >= coupon.max_uses) {
        throw new ApiError(400, "Invalid or expired coupon", "INVALID_COUPON");
      }
      discount = coupon.discount_type === "percentage"
        ? round2((subtotalRounded * coupon.discount_value) / 100)
        : round2(Math.min(coupon.discount_value, subtotalRounded));
      discount = round2(Math.min(discount, subtotalRounded + deliveryFee + serviceFee));
      couponCode = coupon.code;
      await query(`UPDATE coupons SET times_used = times_used + 1 WHERE id = $1`, [coupon.id]);
    }

    const total = round2(subtotalRounded + deliveryFee + serviceFee - discount);

    const order = await this.orders.create(
      {
        userId: actor.id,
        restaurantId: restaurant.id,
        status: "pending_payment",
        subtotal: subtotalRounded,
        deliveryFee,
        serviceFee,
        discount,
        total,
        deliveryAddress: input.deliveryAddress,
        deliveryDistanceKm: distanceKm,
        note: input.note,
        paymentMethod: input.paymentMethod ?? "card",
      },
      lines,
    );

    const items = await this.orders.itemsForOrder(order.id);
    return {
      order,
      items,
      coupon: couponCode ? { code: couponCode, discount } : null,
    };
  }

  async updateStatus(actor: UserEntity, orderId: number, status: string): Promise<OrderEntity> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");

    const next = this.parseStatus(status);
    if (!next) throw new ApiError(400, "Invalid status", "INVALID_STATUS");

    if (actor.role === "restaurant") {
      const restaurant = await this.restaurants.findById(order.restaurantId);
      if (!restaurant || restaurant.ownerId !== actor.id) {
        throw new ApiError(403, "You do not own this restaurant", "FORBIDDEN");
      }
    }

    if (!this.canTransition(actor, order, next)) {
      throw new ApiError(409, `Cannot move order from "${order.status}" to "${next}"`, "INVALID_TRANSITION");
    }

    const updated = await this.orders.updateStatus(orderId, next);
    if (!updated) throw new ApiError(404, "Order not found", "NOT_FOUND");
    return updated;
  }

  async cancel(actor: UserEntity, orderId: number): Promise<OrderEntity> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found", "NOT_FOUND");

    const owner = actor.role === "admin" || order.userId === actor.id;
    if (!owner) throw new ApiError(403, "You cannot cancel this order", "FORBIDDEN");
    if (order.status === "cancelled" || order.status === "refunded") {
      throw new ApiError(409, "Order is already cancelled", "ALREADY_CANCELLED");
    }
    if (["picked_up", "out_for_delivery", "delivered"].includes(order.status)) {
      throw new ApiError(409, `Order cannot be cancelled while "${order.status}"`, "INVALID_TRANSITION");
    }

    const updated = await this.orders.updateStatus(orderId, "cancelled");
    if (!updated) throw new ApiError(404, "Order not found", "NOT_FOUND");
    return updated;
  }

  private parseStatus(status: string | undefined): OrderStatus | undefined | null {
    if (!status || status === "") return undefined;
    const valid: OrderStatus[] = [
      "pending_payment", "paid", "restaurant_accepted", "preparing", "ready_for_pickup",
      "rider_assigned", "picked_up", "out_for_delivery", "delivered", "cancelled", "refunded",
    ];
    return valid.includes(status as OrderStatus) ? (status as OrderStatus) : null;
  }

  private canTransition(actor: UserEntity, order: OrderEntity, next: OrderStatus): boolean {
    if (!TRANSITIONS[order.status].includes(next)) return false;
    if (actor.role === "admin") return true;
    switch (actor.role) {
      case "customer":
        return order.userId === actor.id && (order.status === "pending_payment" || order.status === "paid") && next === "cancelled";
      case "rider":
        return order.riderId === actor.id && (next === "picked_up" || next === "out_for_delivery" || next === "delivered");
      case "restaurant":
        return next === "restaurant_accepted" || next === "preparing" || next === "ready_for_pickup" || next === "cancelled";
      default:
        return false;
    }
  }

  private async assertCanView(actor: UserEntity, order: OrderEntity): Promise<void> {
    if (actor.role === "admin") return;
    let allowed = order.userId === actor.id || order.riderId === actor.id;
    if (!allowed && actor.role === "restaurant") {
      const restaurant = await this.restaurants.findById(order.restaurantId);
      allowed = restaurant?.ownerId === actor.id;
    }
    if (!allowed) throw new ApiError(403, "You cannot view this order", "FORBIDDEN");
  }
}

export const orderService = new OrderService();
