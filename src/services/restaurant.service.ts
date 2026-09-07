import {
  menuRepository,
  restaurantRepository,
} from "@/repositories";
import type {
  MenuItemEntity,
  RestaurantEntity,
  RestaurantRepository,
  MenuRepository,
} from "@/repositories/contracts";
import { query, queryValue } from "@/db/raw";
import { ApiError } from "@/lib/http";
import type { UserEntity } from "@/repositories/contracts";

export class RestaurantService {
  constructor(
    private readonly restaurants: RestaurantRepository = restaurantRepository,
    private readonly menuRepo: MenuRepository = menuRepository,
  ) {}

  async list(filter: {
    q?: string;
    cuisine?: string;
    city?: string;
    open?: boolean;
    sort?: string;
    page: number;
    limit: number;
  }) {
    return this.restaurants.list({
      q: filter.q,
      cuisine: filter.cuisine,
      city: filter.city,
      open: filter.open,
      sort: filter.sort ?? "rating",
      page: filter.page,
      limit: filter.limit,
    });
  }

  async get(id: number) {
    const restaurant = await this.restaurants.findById(id);
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");

    const items = await this.menuRepo.findByRestaurant(id);
    const reviewCount = (await queryValue<number>(`SELECT count(*) FROM reviews WHERE restaurant_id = $1`, [id])) ?? 0;

    return {
      restaurant,
      menu: await this.attachOptions(items),
      reviewCount,
    };
  }

  async menu(id: number) {
    const restaurant = await this.restaurants.findById(id);
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");
    const items = await this.menuRepo.findByRestaurant(id);
    return { restaurantId: id, items: await this.attachOptions(items) };
  }

  async create(actor: UserEntity, input: {
    name: string;
    description?: string;
    cuisine: string;
    imageUrl?: string;
    coverImageUrl?: string;
    address: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    deliveryTimeMinutes?: number;
    minimumOrder?: number;
    isOpen?: boolean;
  }): Promise<RestaurantEntity> {
    if (actor.role !== "restaurant" && actor.role !== "admin") {
      throw new ApiError(403, "Only restaurants or admins can create restaurants", "FORBIDDEN");
    }

    return this.restaurants.create({
      ownerId: actor.id,
      name: input.name.trim(),
      description: input.description,
      cuisine: input.cuisine.trim(),
      imageUrl: input.imageUrl,
      coverImageUrl: input.coverImageUrl,
      address: input.address,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone,
      deliveryTimeMinutes: input.deliveryTimeMinutes,
      minimumOrder: input.minimumOrder,
      isOpen: input.isOpen,
      isApproved: actor.role === "admin",
    });
  }

  async update(actor: UserEntity, id: number, patch: Partial<RestaurantEntity>): Promise<RestaurantEntity> {
    const restaurant = await this.restaurants.findById(id);
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");
    this.assertOwner(actor, restaurant);

    if (patch.isApproved !== undefined && actor.role !== "admin") {
      throw new ApiError(403, "Only admins can change approval status", "FORBIDDEN");
    }

    const updated = await this.restaurants.update(id, patch);
    if (!updated) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");
    return updated;
  }

  async remove(actor: UserEntity, id: number): Promise<void> {
    const restaurant = await this.restaurants.findById(id);
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");
    this.assertOwner(actor, restaurant);
    await this.restaurants.remove(id);
  }

  async addMenuItem(actor: UserEntity, restaurantId: number, input: {
    name: string;
    description?: string;
    price: number;
    category?: string;
    imageUrl?: string;
    isAvailable?: boolean;
    options?: { name: string; price: number }[];
  }): Promise<MenuItemEntity> {
    const restaurant = await this.restaurants.findById(restaurantId);
    if (!restaurant) throw new ApiError(404, "Restaurant not found", "NOT_FOUND");
    this.assertOwner(actor, restaurant);

    const item = await this.menuRepo.create({
      restaurantId,
      name: input.name.trim(),
      description: input.description,
      price: input.price,
      category: input.category,
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
    });

    if (input.options && input.options.length > 0) {
      for (const o of input.options) {
        await query(`INSERT INTO food_item_options (menu_item_id, name, price) VALUES ($1, $2, $3)`, [item.id, o.name, o.price]);
      }
    }
    return item;
  }

  async categories() {
    const rows = await query<{ category: string; n: number }>(
      `SELECT category, count(*) AS n FROM menu_items WHERE is_available = true AND category IS NOT NULL GROUP BY category ORDER BY n DESC`,
    );
    return rows.map((r) => ({ name: r.category, itemCount: Number(r.n) }));
  }

  private async attachOptions(items: MenuItemEntity[]) {
    const ids = items.map((i) => i.id);
    const options = await this.menuRepo.optionsForItems(ids);
    const byItem = new Map<number, typeof options>();
    for (const o of options) {
      const arr = byItem.get(o.menuItemId) ?? [];
      arr.push(o);
      byItem.set(o.menuItemId, arr);
    }
    return items.map((item) => ({ ...item, options: byItem.get(item.id) ?? [] }));
  }

  private assertOwner(actor: UserEntity, restaurant: RestaurantEntity): void {
    if (actor.role === "admin") return;
    if (restaurant.ownerId !== actor.id) {
      throw new ApiError(403, "You do not own this restaurant", "FORBIDDEN");
    }
  }
}

export const restaurantService = new RestaurantService();
