import { mockAddresses } from "@/data/mock";
import type { Address } from "@/data/types";

/**
 * Demo-only address book persistence.
 *
 * Mirrors src/api/orders.local.ts: the customer UI persists to localStorage
 * until the existing Spring Boot address endpoints are wired up. Seeding
 * happens once (when the key is missing), never on every render.
 */
export const ADDRESSES_KEY = "foodrush.addresses";

export function readAddresses(): Address[] {
  try {
    const raw = window.localStorage.getItem(ADDRESSES_KEY);
    if (raw === null) {
      window.localStorage.setItem(ADDRESSES_KEY, JSON.stringify(mockAddresses));
      return mockAddresses;
    }
    const parsed = JSON.parse(raw) as Address[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return mockAddresses;
  }
}

export function writeAddresses(addresses: Address[]) {
  window.localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
}

export function newAddressId() {
  return `addr-${Date.now().toString(36)}`;
}
