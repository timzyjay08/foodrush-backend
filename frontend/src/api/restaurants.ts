import { api } from "./client";
import type { Restaurant } from "@/data/types";

type BackendRestaurant = {
  id: number;
  name: string;
  description?: string;
  cuisine: string;
  imageUrl?: string;
  address: string;
  city: string;
  rating: number;
  ratingCount: number;
  deliveryFee: number;
  deliveryTimeMinutes: number;
  open: boolean;
};

export function toRestaurant(value: BackendRestaurant): Restaurant {
  return {
    id: String(value.id),
    name: value.name,
    tagline: value.description ?? value.cuisine,
    imageUrl: value.imageUrl ?? "",
    categories: [value.cuisine],
    rating: value.rating,
    reviewCount: value.ratingCount,
    deliveryMinutes: [value.deliveryTimeMinutes, value.deliveryTimeMinutes],
    deliveryFee: value.deliveryFee,
    minOrder: 0,
    distanceKm: 0,
    area: value.city,
    isOpen: value.open,
  };
}

export type RestaurantQuery = {
  search?: string;
  category?: string;
  sort?: string;
  minRating?: number;
};

export async function getRestaurants(params: RestaurantQuery = {}) {
  const { data } = await api.get<{ items: BackendRestaurant[] }>("/restaurants", {
    params: {
      q: params.search,
      cuisine: params.category,
      sort: params.sort === "delivery-time" ? "delivery_time" : params.sort,
    },
  });
  return data.items.map(toRestaurant);
}

export async function getRestaurant(id: string) {
  const { data } = await api.get<{ restaurant: BackendRestaurant }>(`/restaurants/${id}`);
  return toRestaurant(data.restaurant);
}

export async function getFeaturedRestaurants() {
  const { data } = await api.get<{ items: BackendRestaurant[] }>("/restaurants", {
    params: { limit: 6 },
  });
  return data.items.map(toRestaurant);
}
