import { pool } from "./index";
import type { PoolClient } from "pg";

/**
 * Raw SQL data-access helpers.
 *
 * The food delivery platform's data access goes through repositories that use
 * these parameterized queries — NO ORM. Parameterized ($1, $2, ...) queries
 * protect against SQL injection, and `pg` (a plain PostgreSQL driver) is used
 * directly, keeping the persistence layer explicit and framework-agnostic.
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

/** Run a parameterized query and return all rows. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

/** Run a query expecting a single row (or null). */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/** Run a query and return the first column of the first row (e.g. COUNT or id). */
export async function queryValue<T = number>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const row = await queryOne<Record<string, unknown>>(sql, params);
  if (!row) return null;
  const value = Object.values(row)[0];
  return (value === null || value === undefined ? null : (value as T));
}

/**
 * Run a set of statements inside a single transaction. Each entry is a tuple
 * of [sql, params]. If any statement fails, the whole transaction rolls back.
 */
export async function transaction<T>(
  statements: Array<[sql: string, params: unknown[]]>,
): Promise<T[]> {
  return withTransaction(async (client) => {
    const results: T[] = [];
    for (const [sql, params] of statements) {
      const res = await client.query(sql, params);
      results.push(res.rows as T);
    }
    return results;
  });
}

/**
 * Run a callback against a dedicated connection inside a single transaction.
 * If the callback throws, the transaction rolls back and the error re-throws.
 *
 * Unlike `transaction(...)`, this allows later statements to depend on values
 * returned by earlier ones (e.g. insert an order, then its line items using
 * the order's generated id), while keeping everything atomic.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
