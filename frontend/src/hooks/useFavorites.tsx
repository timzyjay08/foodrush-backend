import { useCallback, useEffect, useState } from "react";
import { mockFavoriteIds } from "@/data/mock";

const FAVORITES_KEY = "foodrush.favorites";

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      setIds(raw ? (JSON.parse(raw) as string[]) : mockFavoriteIds);
    } catch {
      setIds(mockFavoriteIds);
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback(
    (id: string) => {
      persist(ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
    },
    [ids, persist],
  );

  return { ids, isFavorite: (id: string) => ids.includes(id), toggle };
}
