# FoodRush Backend (Spring Boot)

A production-grade **food delivery marketplace backend** built with Spring Boot.
This is the real backend for the FoodRush platform — it is not a demo or a stub.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.2 |
| Web | Spring Web (REST) |
| Security | Spring Security + JWT (jjwt) + BCrypt |
| Persistence | Spring Data JPA + Hibernate |
| Database | PostgreSQL |
| Validation | Jakarta Bean Validation |
| Payments | Paystack (explicit local simulation only) |
| Monitoring | Actuator + Micrometer (Prometheus) |

## Architecture

```
controller  ->  service  ->  repository  ->  PostgreSQL
   (REST)       (business)    (JPA)
```

- **`controller/`** — REST endpoints, request validation, response envelope.
- **`service/`** — business logic, order state machine, fee calculation.
- **`entity/`** — JPA entities (15 tables).
- **`repository/`** — Spring Data JPA repositories.
- **`security/`** — JWT issuing/validation, stateless filter, auth config.
- **`common/`** — shared enums, API response, exception handler.

## Requirements

- JDK 21+
- Maven 3.8+
- PostgreSQL (or Docker)

## Quick Start

```bash
# 1. Start PostgreSQL (via Docker, from this directory)
docker compose up -d db

# 2. Configure environment (see .env.example)
export JWT_SECRET="a-long-random-secret-string-at-least-32-characters"
export PAYSTACK_SECRET_KEY="your-live-or-test-paystack-secret"

# 3. Run
mvn spring-boot:run
```

The API is now at `http://localhost:8080`. Health check: `GET /actuator/health`.

### Run the whole stack (DB + backend + Prometheus) with Docker

```bash
docker compose up --build
```

Prometheus is available at `http://localhost:9090` and scrapes the backend at
`http://localhost:8080/actuator/prometheus`.

### Load optional development data

```bash
SEED_DATA=true mvn spring-boot:run
```

Seeds an admin, restaurant owner, rider, and customer (`*@foodrush.ng`, password `Password123!`)
plus a few Nigerian restaurants, menu items, and coupons. Disabled by default.

## User Roles

- **CUSTOMER** — browse, order, pay, track, review, favorites, addresses.
- **RESTAURANT** — manage profile & menu, accept/prepare/ready orders.
- **RIDER** — go online, accept deliveries, pickup, deliver, earnings.
- **ADMIN** — manage users/restaurants/riders, coupons, analytics.

## Order State Machine (single source of truth)

```
PENDING_PAYMENT → PAID → RESTAURANT_ACCEPTED → PREPARING → READY_FOR_PICKUP
   → RIDER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
```
Plus `CANCELLED` (from any early state) and `REFUNDED`. The backend enforces every
transition; the frontend only reflects backend state.

## Pricing (computed server-side, never trusted from the client)

- Delivery fee = base ₦500 + distance(km) × ₦100
- Service fee = 5% of subtotal
- Coupon discount (percentage or fixed) applied before total

## Key Endpoints

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any |
| GET | `/api/restaurants` | public |
| GET | `/api/restaurants/{id}` | public |
| GET | `/api/restaurants/{id}/menu` | public |
| GET | `/api/categories` | public |
| GET/POST/DELETE | `/api/cart`, `/api/cart/items`, `/api/cart/items/{id}` | any |
| GET/POST | `/api/orders` | customer |
| GET | `/api/orders/{id}` | participant |
| PATCH | `/api/orders/{id}/status` | role-scoped |
| PATCH | `/api/orders/{id}/cancel` | owner/admin |
| POST | `/api/orders/{id}/assign` | owner/admin |
| POST | `/api/payments/initialize` | customer |
| POST | `/api/payments/verify` | customer |
| POST | `/api/payments/webhook` | Paystack |
| GET/POST | `/api/deliveries` | rider |
| PATCH | `/api/deliveries/{id}/status` | rider |
| GET/PATCH | `/api/riders/me` | rider |
| GET/POST | `/api/reviews` | public/customer |
| GET/POST | `/api/favorites` | any |
| GET/POST/DELETE | `/api/addresses` | any |
| GET/PATCH | `/api/notifications`, `/api/notifications/{id}/read` | any |
| GET | `/api/users`, PATCH `/api/users/{id}` | admin |
| GET | `/api/admin/analytics` | admin |
| GET/POST | `/api/admin/coupons` | admin |
| GET | `/actuator/prometheus` | monitoring |

## API Response Format

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "Unable to process order", "code": "ORDER_PROCESSING_ERROR" }
```

## Payments (Paystack)

- Set `PAYSTACK_SECRET_KEY` to use the live provider.
- Payment operations fail closed when the provider is not configured.
- For local-only testing, explicitly set `PAYSTACK_SIMULATION_ENABLED=true`; never use
  that setting in production.
- The webhook verifies Paystack's `x-paystack-signature` (HMAC-SHA512) and marks the
  order `PAID` — the frontend never decides payment success.

## Testing

Import `postman/FoodRush.postman_collection.json` into Postman to exercise every endpoint.
The backend returns proper HTTP status codes: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.
