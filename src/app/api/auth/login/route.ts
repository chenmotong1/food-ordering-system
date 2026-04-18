import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse, getClientIP } from "@/lib/utils";
import { checkRateLimit, loginLimiter } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIP(req);
    const rateCheck = checkRateLimit(loginLimiter, ip);
    if (!rateCheck.allowed) {
      return errorResponse("请求过于频繁，请稍后再试", "RATE_LIMITED", 429);
    }

    const body = await req.json();
    const { username, password } = body;

    const trimmedUsername = (username ?? "").trim();
    const trimmedPassword = (password ?? "").trim();

    if (!trimmedUsername || !trimmedPassword) {
      return errorResponse("用户名或密码错误", "INVALID_CREDENTIALS", 401);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (!user) {
      return errorResponse("用户名或密码错误", "INVALID_CREDENTIALS", 401);
    }

    // Verify password
    const valid = await verifyPassword(trimmedPassword, user.password);
    if (!valid) {
      return errorResponse("用户名或密码错误", "INVALID_CREDENTIALS", 401);
    }

    // Set session
    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.role = user.role;
    await session.save();

    return successResponse({
      id: user.id,
      username: user.username,
      role: user.role,
      points: user.points,
      memberLevel: user.memberLevel,
      avatar: user.avatar,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
