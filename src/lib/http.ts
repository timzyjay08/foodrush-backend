import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function created<T>(data: T): Response {
  return ok(data, 201);
}

/**
 * Parse and validate a numeric route parameter.
 * Throws a 400 ApiError for anything that is not a positive integer.
 */
export function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid id", "INVALID_ID");
  }
  return id;
}

export function fail(err: unknown): Response {
  // Consistent error shape: { success, message, code }
  if (err instanceof ApiError) {
    return Response.json(
      { success: false, message: err.message, code: err.code },
      { status: err.status },
    );
  }

  if (err instanceof ZodError) {
    return Response.json(
      {
        success: false,
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  // A malformed or empty JSON request body throws a SyntaxError from req.json().
  if (err instanceof SyntaxError) {
    return Response.json(
      { success: false, message: "Invalid JSON in request body", code: "BAD_JSON" },
      { status: 400 },
    );
  }

  console.error("[api:error]", err);
  return Response.json(
    { success: false, message: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

/** Round a money value to 2 decimals. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Delivery fee constants (per FoodRush spec §27)
export const BASE_DELIVERY_FEE = 500; // ₦
export const DISTANCE_RATE_PER_KM = 100; // ₦/km
export const SERVICE_FEE_PERCENT = 0.05; // 5%

/** Official delivery fee calculation: base + distance × rate. */
export function calcDeliveryFee(distanceKm: number): number {
  return round2(BASE_DELIVERY_FEE + distanceKm * DISTANCE_RATE_PER_KM);
}

/** Service fee: 5% of subtotal. */
export function calcServiceFee(subtotal: number): number {
  return round2(subtotal * SERVICE_FEE_PERCENT);
}
