import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, handleAuthError, AuthError } from "@/lib/auth";
import { successResponse, errorResponse, validatePhone, validateUsername, getClientIP } from "@/lib/utils";
import { checkRateLimit, registerLimiter } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIP(req);
    const rateCheck = checkRateLimit(registerLimiter, ip);
    if (!rateCheck.allowed) {
      return errorResponse("请求过于频繁，请稍后再试", "RATE_LIMITED", 429);
    }

    const body = await req.json();
    const { username, password, phone } = body;

    // Validate
    const trimmedUsername = (username ?? "").trim();
    const trimmedPhone = (phone ?? "").trim();
    const trimmedPassword = (password ?? "").trim();

    if (!validateUsername(trimmedUsername)) {
      return errorResponse("用户名需3-20个字符，仅支持字母数字下划线", "VALIDATION_ERROR", 400);
    }
    if (trimmedPassword.length < 6 || trimmedPassword.length > 30) {
      return errorResponse("密码需6-30个字符", "VALIDATION_ERROR", 400);
    }
    if (!validatePhone(trimmedPhone)) {
      return errorResponse("请输入有效的11位手机号", "VALIDATION_ERROR", 400);
    }

    // Check uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });
    if (existingUsername) {
      return errorResponse("该用户名已被注册", "USER_EXISTS", 409);
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone: trimmedPhone },
    });
    if (existingPhone) {
      return errorResponse("该手机号已被注册", "USER_EXISTS", 409);
    }

    // Create user
    const hashedPassword = await hashPassword(trimmedPassword);
    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        password: hashedPassword,
        phone: trimmedPhone,
        role: "customer",
        memberLevel: "bronze",
        points: 0,
      },
      select: {
        id: true,
        username: true,
        phone: true,
        memberLevel: true,
        points: true,
      },
    });

    // Auto login after register
    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.role = "customer";
    await session.save();

    return successResponse(
      {
        ...user,
        phone: user.phone.slice(0, 3) + "****" + user.phone.slice(7),
        role: "customer",
      },
      201
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
