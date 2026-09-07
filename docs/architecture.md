# FoodRush Backend Architecture

The backend follows a clean, modular, layered architecture. No external ORM is
used for data access — all persistence goes through **repositories** that run
**parameterized raw SQL** against PostgreSQL via the `pg` driver.

```
Controller (app/api/**/route.ts)     ← thin: HTTP concerns only
        │  (request parse, auth, validation, response)
        ▼
Service (src/services/*.service.ts)  ← business logic, rules, transactions
        │  (depends on repository CONTRACTS, never concrete SQL)
        ▼
Repository (src/repositories/**)     ← data access (raw SQL, no ORM)
        │  Contracts (interfaces)   → src/repositories/contracts.ts
        │  Implementations (SQL)     → src/repositories/pg/*.repository.ts
        ▼
PostgreSQL (parameterized queries)
```

## Layers

| Layer | Location | Responsibility |
|---|---|---|
| Controllers | `src/app/api/**/route.ts` | Parse request, auth guard, validation, map result → HTTP response. **No business logic, no SQL.** |
| Services | `src/services/*.service.ts` | Business logic: pricing, order state machine, ownership checks, coupon rules. Depends on repository interfaces. |
| Repositories (contracts) | `src/repositories/contracts.ts` | Interfaces describing *what* data operations exist (findByEmail, list, create, …). |
| Repositories (implementations) | `src/repositories/pg/*.repository.ts` | *How* the data is read/written — raw parameterized SQL via `pg`. No ORM. |
| Raw SQL helpers | `src/db/raw.ts` | `query`, `queryOne`, `queryValue`, `transaction` — thin wrappers over the connection pool. |
| Composition root | `src/repositories/index.ts` | Instantiates and binds the concrete repositories to the contracts. |

## Design rules

1. **Controllers stay thin** — they delegate to services.
2. **Business logic lives in services**, not controllers.
3. **Database access goes through repositories** (contracts + implementations).
4. **No ORM** in the data path — repositories use parameterized SQL only
   (`$1, $2, …`), which is injection-safe.
5. **Swappable data source** — to change the store, write a new repository
   implementation behind the same contract; nothing else changes.
6. **Cross-cutting concerns** (notifications, audit logs, real-time events) are
   triggered by controllers after the service completes, keeping services
   focused on business rules.

## Example flow (create order)

`POST /api/orders` → `OrderController` → `OrderService.create()` (validates
restaurant, resolves options, computes price server-side, applies coupon) →
`OrderRepository.create()` (writes order + items in one SQL transaction).

## Notes

- The Drizzle schema (`src/db/schema.ts`) remains only for **table definitions
  and migrations** (`drizzle-kit push`) and the dev seed script. Runtime data
  access never uses it.
- Core modules (auth, restaurants, menu, orders) are fully migrated to this
  layered structure; the remaining modules (payments, deliveries, reviews,
  support) follow the same convention and can be migrated incrementally.
