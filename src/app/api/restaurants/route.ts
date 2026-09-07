import { requireAuth } from "@/lib/auth";
import { createRestaurantSchema } from "@/lib/validators";
import { ok, created, fail } from "@/lib/http";
import { restaurantService } from "@/services/restaurant.service";

export const dynamic = "force-dynamic";

/** Controller (thin): parse query/body, delegate to RestaurantService. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const open = url.searchParams.get("open");
    const result = await restaurantService.list({
      q: (url.searchParams.get("q") ?? "").trim() || undefined,
      cuisine: url.searchParams.get("cuisine")?.trim() || undefined,
      city: url.searchParams.get("city")?.trim() || undefined,
      open: open === "true" ? true : open === "false" ? false : undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      page: Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1),
      limit: Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20)),
    });
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    const data = createRestaurantSchema.parse(body);
    const restaurant = await restaurantService.create(actor, data);
    return created({ restaurant });
  } catch (err) {
    return fail(err);
  }
}
