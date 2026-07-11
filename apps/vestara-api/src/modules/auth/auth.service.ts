import { AuthRepository } from "./auth.repository.js";
import {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
} from "./auth.types.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
} from "./auth.utils.js";

export class AuthService {
  constructor(private repo: AuthRepository) {}

  async register(dto: RegisterDTO): Promise<AuthResponse> {
    const existing = await this.repo.findByEmail(dto.email);

    if (existing) {
      throw new Error("Email already in use");
    }

    const user = await this.repo.create({
      email: dto.email,
      phone: dto.phone,
      passwordHash: await hashPassword(dto.password),
    });

    const token = signToken({
      userId: user.id,
      email: user.email ?? "",
    });

    const { passwordHash, ...safeUser } = user;

    return {
      token,
      user: safeUser,
    };
  }

  async login(dto: LoginDTO): Promise<AuthResponse> {
    const user = await this.repo.findByIdentifier(dto.identifier);

    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const isValid = await verifyPassword(
      user.passwordHash,
      dto.password
    );

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = signToken({
      userId: user.id,
      email: user.email ?? "",
    });

    const { passwordHash, ...safeUser } = user;

    return {
      token,
      user: safeUser,
    };
  }

  async me(userId: string) {
    const user = await this.repo.findById(userId);

    if (!user) return null;

    const { passwordHash, ...safe } = user;
    return safe;
  }
}