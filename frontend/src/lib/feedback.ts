import { toast } from "sonner";

/**
 * The single toast/feedback surface for FoodRush.
 * Components must call these helpers instead of importing `toast` directly so
 * copy stays consistent across customer, restaurant, rider and admin areas.
 */
export const feedback = {
  addedToCart(name: string) {
    toast.success(`${name} added to cart`);
  },
  removedFromCart(name: string) {
    toast(`${name} removed from cart`);
  },
  favoriteAdded(name: string) {
    toast.success(`${name} saved to favourites`);
  },
  favoriteRemoved(name: string) {
    toast(`${name} removed from favourites`);
  },
  saved(what = "Changes") {
    toast.success(`${what} saved`);
  },
  deleted(what = "Item") {
    toast(`${what} deleted`);
  },
  orderPlaced(reference: string) {
    toast.success("Order placed", { description: `Reference ${reference}` });
  },
  error(message = "Something went wrong. Please try again.") {
    toast.error(message);
  },
  info(message: string, description?: string) {
    toast(message, description ? { description } : undefined);
  },
};

export type Feedback = typeof feedback;
