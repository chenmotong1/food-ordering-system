import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  try {
    await requireManager();
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return successResponse(coupons);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireManager();
    const body = await req.json();

    const { code, name, type, value, minOrderAmount, maxDiscount, totalCount, startAt, expireAt } = body;

    if (!code?.trim() || !name?.trim() || !type || typeof value !== "number") {
      return errorResponse("优惠码、名称、类型和值为必填项", "VALIDATION_ERROR", 400);
    }
    if (!["fixed", "percent"].includes(type)) {
      return errorResponse("类型必须为 fixed 或 percent", "VALIDATION_ERROR", 400);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        type,
        value,
        minOrderAmount: typeof minOrderAmount === "number" ? minOrderAmount : 0,
        maxDiscount: maxDiscount ?? null,
        totalCount: typeof totalCount === "number" ? totalCount : -1,
        startAt: new Date(startAt || Date.now()),
        expireAt: new Date(expireAt),
      },
    });

    return successResponse(coupon, 201);
  } catch (error) {
    return handleAuthError(error);
  }
}
