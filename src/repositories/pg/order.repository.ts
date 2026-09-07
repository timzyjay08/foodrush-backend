import { query, queryOne, queryValue, withTransaction } from "@/db/raw";
import type { NewOrderInput, NewOrderItemInput, OrderEntity, OrderItemEntity, OrderRepository, OrderStatus } from "../contracts";

const ORDER_COLUMNS = `id, user_id, restaurant_id, rider_id, status, subtotal, delivery_fee, service_fee, discount, total,
  delivery_address, delivery_distance_km, note, payment_method, created_at, updated_at`;

function mapOrder(r: Record<string, unknown>): OrderEntity {
  return {
    id: r.id as number,
    userId: r.user_id as number,
    restaurantId: r.restaurant_id as number,
    riderId: (r.rider_id as number | null) ?? null,
    status: r.status as OrderStatus,
    subtotal: r.subtotal as number,
    deliveryFee: r.delivery_fee as number,
    serviceFee: r.service_fee as number,
    discount: r.discount as number,
    total: r.total as number,
    deliveryAddress: r.delivery_address as string,
    deliveryDistanceKm: r.delivery_distance_km as number,
    note: (r.note as string | null) ?? null,
    paymentMethod: r.payment_method as string,
    createdAt: r.created_at as Date | null,
    updatedAt: r.updated_at as Date | null,
  };
}

function mapItem(r: Record<string, unknown>): OrderItemEntity {
  return {
    id: r.id as number,
    orderId: r.order_id as number,
    menuItemId: (r.menu_item_id as number | null) ?? null,
    name: r.name as string,
    price: r.price as number,
    quantity: r.quantity as number,
    options: (r.options as { name: string; price: number }[]) ?? [],
    specialInstructions: (r.special_instructions as string | null) ?? null,
  };
}

export class PgOrderRepository implements OrderRepository {
  async create(input: NewOrderInput, items: NewOrderItemInput[]): Promise<OrderEntity> {
    // Order + items are written atomically in a single transaction. If any item
    // insert fails, the whole order is rolled back (no orphaned order).
    const orderRow = await withTransaction(async (client) => {
      const orderRes = await client.query(
        `INSERT INTO orders
           (user_id, restaurant_id, rider_id, status, subtotal, delivery_fee, service_fee, discount, total, delivery_address, delivery_distance_km, note, payment_method)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING ${ORDER_COLUMNS}`,
        [
          input.userId,
          input.restaurantId,
          input.riderId ?? null,
          input.status,
          input.subtotal,
          input.deliveryFee,
          input.serviceFee,
          input.discount,
          input.total,
          input.deliveryAddress,
          input.deliveryDistanceKm,
          input.note ?? null,
          input.paymentMethod ?? "card",
        ],
      );

      const orderId = orderRes.rows[0].id as number;

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, options, special_instructions)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            orderId,
            item.menuItemId,
            item.name,
            item.price,
            item.quantity,
            JSON.stringify(item.options),
            item.specialInstructions ?? null,
          ],
        );
      }

      return orderRes.rows[0] as Record<string, unknown>;
    });

    return mapOrder(orderRow);
  }

  async findById(id: number): Promise<OrderEntity | null> {
    const row = await queryOne(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1`, [id]);
    return row ? mapOrder(row) : null;
  }

  async itemsForOrder(orderId: number): Promise<OrderItemEntity[]> {
    const rows = await query(
      `SELECT id, order_id, menu_item_id, name, price, quantity, options, special_instructions
       FROM order_items WHERE order_id = $1 ORDER BY id`,
      [orderId],
    );
    return rows.map(mapItem);
  }

  async listByUser(userId: number, status?: OrderStatus): Promise<OrderEntity[]> {
    const rows = status
      ? await query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC`, [userId, status])
      : await query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return rows.map(mapOrder);
  }

  async listByRider(riderId: number, status?: OrderStatus): Promise<OrderEntity[]> {
    const rows = status
      ? await query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE rider_id = $1 AND status = $2 ORDER BY created_at DESC`, [riderId, status])
      : await query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE rider_id = $1 ORDER BY created_at DESC`, [riderId]);
    return rows.map(mapOrder);
  }

  async listByRestaurants(restaurantIds: number[], status?: OrderStatus): Promise<OrderEntity[]> {
    if (restaurantIds.length === 0) return [];
    const placeholders = restaurantIds.map((_, i) => `$${i + 1}`).join(", ");
    const rows = status
      ? await query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE restaurant_id IN (${placeholders}) AND status = $${restaurantIds.length + 1} ORDER BY created_at DESC`, [...restaurantIds, status])
      : await query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE restaurant_id IN (${placeholders}) ORDER BY created_at DESC`, restaurantIds);
    return rows.map(mapOrder);
  }

  async listAll(status?: OrderStatus): Promise<OrderEntity[]> {
    const rows = status
      ? await query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE status = $1 ORDER BY created_at DESC`, [status])
      : await query(`SELECT ${ORDER_COLUMNS} FROM orders ORDER BY created_at DESC`);
    return rows.map(mapOrder);
  }

  async updateStatus(id: number, status: OrderStatus): Promise<OrderEntity | null> {
    const rows = await query(
      `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING ${ORDER_COLUMNS}`,
      [status, id],
    );
    return rows.length ? mapOrder(rows[0]) : null;
  }

  async assignRider(id: number, riderId: number, status: OrderStatus): Promise<OrderEntity | null> {
    const rows = await query(
      `UPDATE orders SET rider_id = $1, status = $2, updated_at = now() WHERE id = $3 RETURNING ${ORDER_COLUMNS}`,
      [riderId, status, id],
    );
    return rows.length ? mapOrder(rows[0]) : null;
  }
}
