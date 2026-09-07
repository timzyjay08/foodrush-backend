import { query, queryOne, queryValue } from "@/db/raw";
import type {
  NewRestaurantInput,
  PaginatedResult,
  RestaurantEntity,
  RestaurantFilter,
  RestaurantRepository,
} from "../contracts";

const COLUMNS = `id, owner_id, name, slug, description, cuisine, image_url, cover_image_url, address, city,
  latitude, longitude, phone, rating, rating_count, delivery_fee, delivery_time_minutes, minimum_order,
  is_open, is_approved, created_at, updated_at`;

function mapRow(r: Record<string, unknown>): RestaurantEntity {
  return {
    id: r.id as number,
    ownerId: (r.owner_id as number | null) ?? null,
    name: r.name as string,
    slug: (r.slug as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    cuisine: r.cuisine as string,
    imageUrl: (r.image_url as string | null) ?? null,
    coverImageUrl: (r.cover_image_url as string | null) ?? null,
    address: r.address as string,
    city: r.city as string,
    latitude: (r.latitude as number | null) ?? null,
    longitude: (r.longitude as number | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    rating: r.rating as number,
    ratingCount: r.rating_count as number,
    deliveryFee: r.delivery_fee as number,
    deliveryTimeMinutes: r.delivery_time_minutes as number,
    minimumOrder: r.minimum_order as number,
    isOpen: r.is_open as boolean,
    isApproved: r.is_approved as boolean,
    createdAt: r.created_at as Date | null,
    updatedAt: r.updated_at as Date | null,
  };
}

export class PgRestaurantRepository implements RestaurantRepository {
  async findById(id: number): Promise<RestaurantEntity | null> {
    const row = await queryOne(`SELECT ${COLUMNS} FROM restaurants WHERE id = $1`, [id]);
    return row ? mapRow(row) : null;
  }

  async findByOwner(ownerId: number): Promise<RestaurantEntity[]> {
    const rows = await query(`SELECT ${COLUMNS} FROM restaurants WHERE owner_id = $1 ORDER BY id`, [ownerId]);
    return rows.map(mapRow);
  }

  async list(filter: RestaurantFilter): Promise<PaginatedResult<RestaurantEntity>> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filter.q) {
      params.push(`%${filter.q}%`, `%${filter.q}%`);
      where.push(`(name ILIKE $${params.length - 1} OR cuisine ILIKE $${params.length})`);
    }
    if (filter.cuisine) {
      params.push(filter.cuisine);
      where.push(`cuisine = $${params.length}`);
    }
    if (filter.city) {
      params.push(filter.city);
      where.push(`city = $${params.length}`);
    }
    if (filter.open !== undefined) {
      params.push(filter.open);
      where.push(`is_open = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const orderBy =
      filter.sort === "delivery_time"
        ? "delivery_time_minutes ASC"
        : filter.sort === "newest"
          ? "created_at DESC"
          : "rating DESC";

    const total = (await queryValue<number>(`SELECT count(*) FROM restaurants ${whereSql}`, params)) ?? 0;
    const offset = (filter.page - 1) * filter.limit;

    const rows = await query(
      `SELECT ${COLUMNS} FROM restaurants ${whereSql} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, filter.limit, offset],
    );

    return {
      items: rows.map(mapRow),
      total,
      page: filter.page,
      limit: filter.limit,
      pages: Math.ceil(total / filter.limit),
    };
  }

  async create(input: NewRestaurantInput): Promise<RestaurantEntity> {
    const rows = await query(
      `INSERT INTO restaurants
         (owner_id, name, description, cuisine, image_url, cover_image_url, address, city, latitude, longitude, phone, delivery_time_minutes, minimum_order, is_open, is_approved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING ${COLUMNS}`,
      [
        input.ownerId,
        input.name,
        input.description ?? null,
        input.cuisine,
        input.imageUrl ?? null,
        input.coverImageUrl ?? null,
        input.address,
        input.city ?? "Lagos",
        input.latitude ?? null,
        input.longitude ?? null,
        input.phone ?? null,
        input.deliveryTimeMinutes ?? 30,
        input.minimumOrder ?? 0,
        input.isOpen ?? true,
        input.isApproved ?? true,
      ],
    );
    return mapRow(rows[0]);
  }

  async update(id: number, patch: Partial<RestaurantEntity>): Promise<RestaurantEntity | null> {
    const fields: Array<[keyof RestaurantEntity, string]> = [
      ["name", "name"],
      ["description", "description"],
      ["cuisine", "cuisine"],
      ["imageUrl", "image_url"],
      ["coverImageUrl", "cover_image_url"],
      ["address", "address"],
      ["city", "city"],
      ["latitude", "latitude"],
      ["longitude", "longitude"],
      ["phone", "phone"],
      ["deliveryTimeMinutes", "delivery_time_minutes"],
      ["minimumOrder", "minimum_order"],
      ["isOpen", "is_open"],
      ["isApproved", "is_approved"],
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
      `UPDATE restaurants SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING ${COLUMNS}`,
      params,
    );
    return rows.length ? mapRow(rows[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await queryValue<number>(`DELETE FROM restaurants WHERE id = $1 RETURNING id`, [id]);
    return result !== null;
  }
}
