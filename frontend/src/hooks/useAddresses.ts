import { useCallback, useEffect, useState } from "react";
import { newAddressId, readAddresses, writeAddresses } from "@/api/addresses.local";
import type { Address } from "@/data/types";

export type AddressInput = Omit<Address, "id" | "isDefault">;

/**
 * Address book state for customer screens. Backed by the demo localStorage
 * layer in src/api/addresses.local.ts so /addresses and /checkout share one
 * source of truth and survive refreshes.
 */
export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAddresses(readAddresses());
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: Address[]) => {
    setAddresses(next);
    writeAddresses(next);
  }, []);

  const add = useCallback(
    (input: AddressInput) => {
      const next = readAddresses();
      const address: Address = {
        ...input,
        id: newAddressId(),
        isDefault: next.length === 0,
      };
      persist([...next, address]);
      return address;
    },
    [persist],
  );

  const update = useCallback(
    (id: string, input: AddressInput) => {
      persist(readAddresses().map((item) => (item.id === id ? { ...item, ...input } : item)));
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      const next = readAddresses().filter((item) => item.id !== id);
      if (next.length && !next.some((item) => item.isDefault)) {
        next[0] = { ...next[0]!, isDefault: true };
      }
      persist(next);
    },
    [persist],
  );

  const setDefault = useCallback(
    (id: string) => {
      persist(readAddresses().map((item) => ({ ...item, isDefault: item.id === id })));
    },
    [persist],
  );

  const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0] ?? null;

  return { addresses, isLoading, add, update, remove, setDefault, defaultAddress };
}
