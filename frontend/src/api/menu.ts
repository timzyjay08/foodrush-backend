import { api } from "./client";
import type { MenuItem } from "@/data/types";

type BackendMenuItem = {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  available?: boolean;
};

export async function getMenu(restaurantId: string) {
  const { data } = await api.get<{ items: BackendMenuItem[] }>(`/restaurants/${restaurantId}/menu`);
  const items: MenuItem[] = [];
  for (const item of data.items as BackendMenuItem[]) {
    items.push({
      id: String(item.id),
      restaurantId,
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      section: item.category ?? "Menu",
      imageUrl: item.imageUrl ?? "",
      tags: [],
    });
  }
  return items;
}

export async function getMenuItem(restaurantId: string, itemId: string) {
  const { data } = await api.get<MenuItem>(`/restaurants/${restaurantId}/menu/${itemId}`);
  return data;
}

export async function getCategories() {
  const { data } = await api.get<{ categories: Array<{ name: string }> }>("/categories");
  const categories: { id: string; name: string }[] = [];
  for (const category of data.categories as Array<{ name: string }>) {
    categories.push({ id: category.name, name: category.name });
  }
  return categories;
}
