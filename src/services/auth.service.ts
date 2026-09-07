import { userRepository } from "@/repositories";
import type { Role, UserEntity, UserRepository } from "@/repositories/contracts";
import { query } from "@/db/raw";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { ApiError } from "@/lib/http";

export interface AuthResult {
  user: Omit<UserEntity, "passwordHash">;
  token: string;
}

export class AuthService {
  constructor(private readonly users: UserRepository = userRepository) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (await this.users.existsByEmail(email)) {
      throw new ApiError(409, "An account with this email already exists", "EMAIL_TAKEN");
    }

    const role = this.normalizeRole(input.role ?? "customer");

    const user = await this.users.create({
      name: input.name.trim(),
      email,
      passwordHash: await hashPassword(input.password),
      phone: input.phone ?? null,
      role,
    });

    // A rider registration also creates a rider profile record.
    if (role === "rider") {
      await query(`INSERT INTO delivery_riders (user_id) VALUES ($1)`, [user.id]);
    }

    return this.toAuthResult(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    if (user.isSuspended) {
      throw new ApiError(403, "Your account has been suspended. Please contact support.", "ACCOUNT_SUSPENDED");
    }
    return this.toAuthResult(user);
  }

  private normalizeRole(role: string): Role {
    const valid: Role[] = ["customer", "restaurant", "rider", "learner", "mentor"];
    if (valid.includes(role as Role)) return role as Role;
    if (role === "admin") throw new ApiError(403, "Admin accounts cannot be self-registered", "FORBIDDEN");
    throw new ApiError(400, "Invalid role", "INVALID_ROLE");
  }

  private async toAuthResult(user: UserEntity): Promise<AuthResult> {
    const token = await signToken(String(user.id), { role: user.role, email: user.email });
    const { passwordHash: _hash, ...safe } = user;
    return { user: safe, token };
  }
}

export const authService = new AuthService();
