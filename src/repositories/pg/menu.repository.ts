import { query, queryOne, queryValue } from "@/db/raw";
import type { FoodOptionEntity, MenuItemEntity, MenuRepository } from "../contracts";

const ITEM_COLUMNS = `id, restaurant_id, name, description, price, category, image_url, is_available, created_at, updated_at`;

function mapItem(r: Record<string, unknown>): MenuItemEntity {
  return {
    id: r.id as number,
    restaurantId: r.restaurant_id as number,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    price: r.price as number,
    category: (r.category as string | null) ?? null,
    imageUrl: (r.image_url as string | null) ?? null,
    isAvailable: r.is_available as boolean,
    createdAt: r.created_at as Date | null,
    updatedAt: r.updated_at as Date | null,
  };
}

function mapOption(r: Record<string, unknown>): FoodOptionEntity {
  return {
    id: r.id as number,
    menuItemId: r.menu_item_id as number,
    name: r.name as string,
    price: r.price as number,
    isAvailable: r.is_available as boolean,
  };
}

export class PgMenuRepository implements MenuRepository {
  async findByRestaurant(restaurantId: number): Promise<MenuItemEntity[]> {
    const rows = await query(
      `SELECT ${ITEM_COLUMNS} FROM menu_items WHERE restaurant_id = $1 ORDER BY category ASC, name ASC`,
      [restaurantId],
    );
    return rows.map(mapItem);
  }

  async findById(id: number): Promise<MenuItemEntity | null> {
    const row = await queryOne(`SELECT ${ITEM_COLUMNS} FROM menu_items WHERE id = $1`, [id]);
    return row ? mapItem(row) : null;
  }

  async create(input: {
    restaurantId: number;
    name: string;
    description?: string | null;
    price: number;
    category?: string | null;
    imageUrl?: string | null;
    isAvailable?: boolean;
  }): Promise<MenuItemEntity> {
    const rows = await query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING ${ITEM_COLUMNS}`,
      [input.restaurantId, input.name, input.description ?? null, input.price, input.category ?? null, input.imageUrl ?? null, input.isAvailable ?? true],
    );
    return mapItem(rows[0]);
  }

  async update(id: number, patch: Partial<MenuItemEntity>): Promise<MenuItemEntity | null> {
    const fields: Array<[keyof MenuItemEntity, string]> = [
      ["name", "name"],
      ["description", "description"],
      ["price", "price"],
      ["category", "category"],
      ["imageUrl", "image_url"],
      ["isAvailable", "is_available"],
    ];
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [field, column] of fields) {
      if (field in patch && patch[field] !== undefined) {
        params.push(patch[field]);
        sets.push(`${column} = $${params.length}`);
      }
    }
    if (sets.length === 0) return this.findById(id);
    params.push(id);
    sets.push(`updated_at = now()`);

    const rows = await query(
      `UPDATE menu_items SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING ${ITEM_COLUMNS}`,
      params,
    );
    return rows.length ? mapItem(rows[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await queryValue<number>(`DELETE FROM menu_items WHERE id = $1 RETURNING id`, [id]);
    return result !== null;
  }

  async optionsForItems(itemIds: number[]): Promise<FoodOptionEntity[]> {
    if (itemIds.length === 0) return [];
    const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(", ");
    const rows = await query(
      `SELECT id, menu_item_id, name, price, is_available FROM food_item_options WHERE menu_item_id IN (${placeholders})`,
      itemIds,
    );
    return rows.map(mapOption);
  }
}
