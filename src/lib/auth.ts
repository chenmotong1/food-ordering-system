import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { errorResponse } from "./utils";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      phone: true,
      email: true,
      avatar: true,
      role: true,
      points: true,
      memberLevel: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) return null;
  if (user.role !== session.role) {
    session.role = user.role;
    await session.save();
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("请先登录", "AUTH_REQUIRED", 401);
  }
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError("权限不足", "FORBIDDEN", 403);
  }
  return user;
}

export function requireManager() {
  return requireRole(["manager", "admin"]);
}

export function requireAdmin() {
  return requireRole(["admin"]);
}

export function requireStaff() {
  return requireRole(["employee", "manager", "admin"]);
}

export class AuthError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AuthError";
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.code, error.status);
  }
  throw error;
}
