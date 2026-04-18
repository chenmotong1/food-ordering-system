import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, getClientIP } from "@/lib/utils";
import { checkRateLimit, couponLimiter } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rateCheck = checkRateLimit(couponLimiter, ip);
    if (!rateCheck.allowed) {
      return errorResponse("请求过于频繁，请稍后再试", "RATE_LIMITED", 429);
    }

    const body = await req.json();
    const { code, orderAmount } = body;

    if (!code?.trim()) {
      return errorResponse("请输入优惠码", "VALIDATION_ERROR", 400);
    }
    if (typeof orderAmount !== "number" || orderAmount < 0) {
      return errorResponse("订单金额无效", "VALIDATION_ERROR", 400);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim() },
    });

    if (!coupon) {
      return errorResponse("优惠券不存在", "COUPON_NOT_FOUND", 400);
    }
    if (!coupon.isActive) {
      return errorResponse("优惠券未激活", "COUPON_INACTIVE", 400);
    }
    const now = new Date();
    if (now > coupon.expireAt) {
      return errorResponse("优惠券已过期", "COUPON_EXPIRED", 400);
    }
    if (now < coupon.startAt) {
      return errorResponse("优惠券尚未生效", "COUPON_NOT_FOUND", 400);
    }
    if (coupon.totalCount !== -1 && coupon.usedCount >= coupon.totalCount) {
      return errorResponse("优惠券已被用完", "COUPON_USED_UP", 400);
    }
    if (orderAmount < coupon.minOrderAmount) {
      const diff = (coupon.minOrderAmount - orderAmount).toFixed(2);
      return errorResponse(
        `该优惠券需满 ¥${coupon.minOrderAmount.toFixed(2)} 使用，还差 ¥${diff}`,
        "COUPON_MIN_AMOUNT",
        400
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "fixed") {
      discountAmount = coupon.value;
    } else if (coupon.type === "percent") {
      discountAmount = orderAmount * (1 - coupon.value);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    discountAmount = Math.min(discountAmount, orderAmount);
    const finalAmount = orderAmount - discountAmount;

    return successResponse({
      couponId: coupon.id,
      name: coupon.name,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
    });
  } catch (error) {
    console.error("POST /api/coupons/verify error:", error);
    return errorResponse("验证优惠券失败", "INTERNAL_ERROR", 500);
  }
}
