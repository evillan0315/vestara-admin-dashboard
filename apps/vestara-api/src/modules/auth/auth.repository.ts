import { prisma } from "../../config/prisma.js";
import {
  Prisma,
  User,
} from "@prisma/client";

export class AuthRepository {
  async create(
    data: Prisma.UserCreateInput,
  ): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async findById(
    id: string,
  ): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(
    email: string,
  ): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(
    phone: string,
  ): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByIdentifier(
    identifier: string,
  ): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [
          {
            email: identifier,
          },
          {
            phone: identifier,
          },
        ],
      },
    });
  }

  async existsByEmail(
    email: string,
  ): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });

    return count > 0;
  }

  async existsByPhone(
    phone: string,
  ): Promise<boolean> {
    const count = await prisma.user.count({
      where: { phone },
    });

    return count > 0;
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
      },
    });
  }

  async deleteById(
    userId: string,
  ): Promise<User> {
    return prisma.user.delete({
      where: {
        id: userId,
      },
    });
  }
}