import { query, queryOne, queryValue } from "@/db/raw";
import type { NewUserInput, UserEntity, UserRepository } from "../contracts";

/** Map a raw DB row (snake_case) to a typed UserEntity (camelCase). */
function mapRow(r: Record<string, unknown>): UserEntity {
  return {
    id: r.id as number,
    name: r.name as string,
    email: r.email as string,
    passwordHash: (r.password_hash as string | null) ?? null,
    googleId: (r.google_id as string | null) ?? null,
    avatarUrl: (r.avatar_url as string | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    role: r.role as UserEntity["role"],
    isSuspended: r.is_suspended as boolean,
    createdAt: r.created_at as Date | null,
    updatedAt: r.updated_at as Date | null,
  };
}

export class PgUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await queryOne(
      `SELECT id, name, email, password_hash, google_id, avatar_url, phone, role, is_suspended, created_at, updated_at
       FROM users WHERE email = $1`,
      [email],
    );
    return row ? mapRow(row) : null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    const row = await queryOne(
      `SELECT id, name, email, password_hash, google_id, avatar_url, phone, role, is_suspended, created_at, updated_at
       FROM users WHERE id = $1`,
      [id],
    );
    return row ? mapRow(row) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const value = await queryValue<number>(`SELECT 1 FROM users WHERE email = $1`, [email]);
    return value !== null;
  }

  async create(input: NewUserInput): Promise<UserEntity> {
    const rows = await query(
      `INSERT INTO users (name, email, password_hash, google_id, avatar_url, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, password_hash, google_id, avatar_url, phone, role, is_suspended, created_at, updated_at`,
      [
        input.name,
        input.email,
        input.passwordHash,
        input.googleId ?? null,
        input.avatarUrl ?? null,
        input.phone ?? null,
        input.role,
      ],
    );
    return mapRow(rows[0]);
  }

  async update(id: number, patch: Partial<UserEntity>): Promise<UserEntity | null> {
    // Build a dynamic but parameterized UPDATE from the allowed patch fields.
    const sets: string[] = [];
    const params: unknown[] = [];
    const fields: Array<[keyof UserEntity, string]> = [
      ["name", "name"],
      ["phone", "phone"],
      ["role", "role"],
      ["isSuspended", "is_suspended"],
      ["passwordHash", "password_hash"],
      ["googleId", "google_id"],
      ["avatarUrl", "avatar_url"],
    ];
    for (const [field, column] of fields) {
      if (field in patch) {
        params.push(patch[field]);
        sets.push(`${column} = $${params.length}`);
      }
    }
    if (sets.length === 0) return this.findById(id);
    params.push(id);
    sets.push(`updated_at = now()`);

    const rows = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length}
       RETURNING id, name, email, password_hash, google_id, avatar_url, phone, role, is_suspended, created_at, updated_at`,
      params,
    );
    return rows.length ? mapRow(rows[0]) : null;
  }
}
