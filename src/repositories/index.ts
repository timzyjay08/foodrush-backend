import { PgUserRepository } from "./pg/user.repository";
import { PgRestaurantRepository } from "./pg/restaurant.repository";
import { PgMenuRepository } from "./pg/menu.repository";
import { PgOrderRepository } from "./pg/order.repository";
import type {
  UserRepository,
  RestaurantRepository,
  MenuRepository,
  OrderRepository,
} from "./contracts";

/**
 * Repository factory — the composition root for data access.
 *
 * Controllers receive services, and services receive these concrete
 * repositories. They are instantiated once here (as singletons) and bound to
 * the PostgreSQL implementation; swapping to another store means writing a new
 * implementation behind the same contracts, nothing else changes.
 */
export const userRepository: UserRepository = new PgUserRepository();
export const restaurantRepository: RestaurantRepository = new PgRestaurantRepository();
export const menuRepository: MenuRepository = new PgMenuRepository();
export const orderRepository: OrderRepository = new PgOrderRepository();
