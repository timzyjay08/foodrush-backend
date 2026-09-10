import { queryOptions } from "@tanstack/react-query";
import type { RestaurantQuery } from "@/api/restaurants";
import { mockPopularItems } from "@/data/mock";
import type { MenuItem, Restaurant, Address, Category } from "@/data/types";
import { getCategories, getMenu } from "@/api/menu";
import { getOrders, getOrder } from "@/api/orders";
import { getRestaurants, getRestaurant } from "@/api/restaurants";
import { api } from "@/api/client";

/**
 * Query layer. Each queryFn currently resolves mock data; swapping in the
 * matching function from src/api/* is the whole backend integration step.
 *
 *   queryFn: () => getRestaurants(params)
 */

const delay = <T>(value: T, ms = 350) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

export const restaurantsQuery = (params: RestaurantQuery = {}) =>
  queryOptions({
    queryKey: ["restaurants", params],
    queryFn: () => getRestaurants(params),
  });

export const restaurantQuery = (id: string) =>
  queryOptions({
    queryKey: ["restaurant", id],
    queryFn: () => getRestaurant(id),
  });

export const menuQuery = (restaurantId: string) =>
  queryOptions({
    queryKey: ["menu", restaurantId],
    queryFn: () => getMenu(restaurantId),
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => getCategories() as Promise<Category[]>,
  });

export const popularItemsQuery = () =>
  queryOptions({ queryKey: ["popular-items"], queryFn: () => delay<MenuItem[]>(mockPopularItems) });

export const ordersQuery = () => queryOptions({ queryKey: ["orders"], queryFn: () => getOrders() });

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
  });

export const addressesQuery = () =>
  queryOptions({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get<Address[]>("/addresses");
      return data.map((address) => ({
        ...address,
        area: address.area ?? address.city,
        instructions: address.instructions ?? "",
      }));
    },
  });
