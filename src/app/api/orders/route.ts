import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  generateOrderNo,
  generatePickupNo,
  calcEstimatedTime,
  calcPointsEarned,
  getMemberLevel,
} from "@/lib/utils";
import { checkRateLimit, orderLimiter } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Record<string, unknown> = {};

    // Normal user: only own orders
    if (user.role === "customer") {
      where.userId = user.id;
    }
    // Staff/manager/admin can see all orders
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { orderTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return successResponse({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limit per user
    const rateCheck = checkRateLimit(orderLimiter, user.id);
    if (!rateCheck.allowed) {
      return errorResponse("下单过于频繁，请稍后再试", "RATE_LIMITED", 429);
    }

    const body = await req.json();
    const { orderType, tableNo, items, couponCode, remark } = body;

    // Validate orderType
    if (!["dine_in", "takeout"].includes(orderType)) {
      return errorResponse("用餐方式无效", "VALIDATION_ERROR", 400);
    }
    if (orderType === "dine_in" && (!tableNo || !tableNo.trim())) {
      return errorResponse("堂食需填写桌号", "VALIDATION_ERROR", 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse("购物车为空", "CART_EMPTY", 400);
    }

    // Calculate order items
    let originalPrice = 0;
    const orderItemsData: Array<{
      dishId: string;
      dishName: string;
      dishImage: string;
      quantity: number;
      unitPrice: number;
      specSummary: string;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const dish = await prisma.dish.findUnique({
        where: { id: item.dishId },
      });

      if (!dish || !dish.isAvailable) {
        return errorResponse(`菜品 ${dish?.name || item.dishId} 已下架`, "NOT_FOUND", 400);
      }
      if (dish.stock < item.quantity) {
        return errorResponse(
          `${dish.name} 库存不足，仅剩 ${dish.stock} 份`,
          "STOCK_INSUFFICIENT",
          400
        );
      }

      // Calculate unit price with spec adjustments
      let unitPrice = dish.price;
      const specParts: string[] = [];

      if (Array.isArray(item.specs)) {
        for (const spec of item.specs) {
          unitPrice += spec.priceAdjust || 0;
          if (spec.specName && spec.priceAdjust > 0) {
            specParts.push(spec.specName);
          } else if (spec.specName) {
            specParts.push(spec.specName);
          }
        }
      }

      const subtotal = unitPrice * item.quantity;
      originalPrice += subtotal;

      orderItemsData.push({
        dishId: dish.id,
        dishName: dish.name,
        dishImage: dish.imageUrl,
        quantity: item.quantity,
        unitPrice,
        specSummary: specParts.join(" / ") || "",
        subtotal,
      });
    }

    // Coupon validation
    let discountAmount = 0;
    let couponId: string | null = null;

    if (couponCode?.trim()) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim() },
      });

      if (!coupon) {
        return errorResponse("优惠券不存在", "COUPON_NOT_FOUND", 400);
      }
      if (!coupon.isActive) {
        return errorResponse("优惠券未激活", "COUPON_INACTIVE", 400);
      }
      if (new Date() > coupon.expireAt) {
        return errorResponse("优惠券已过期", "COUPON_EXPIRED", 400);
      }
      if (new Date() < coupon.startAt) {
        return errorResponse("优惠券尚未生效", "COUPON_NOT_FOUND", 400);
      }
      if (coupon.totalCount !== -1 && coupon.usedCount >= coupon.totalCount) {
        return errorResponse("优惠券已被用完", "COUPON_USED_UP", 400);
      }
      if (originalPrice < coupon.minOrderAmount) {
        const diff = (coupon.minOrderAmount - originalPrice).toFixed(2);
        return errorResponse(
          `该优惠券需满 ¥${coupon.minOrderAmount.toFixed(2)} 使用，还差 ¥${diff}`,
          "COUPON_MIN_AMOUNT",
          400
        );
      }

      couponId = coupon.id;

      if (coupon.type === "fixed") {
        discountAmount = coupon.value;
      } else if (coupon.type === "percent") {
        discountAmount = originalPrice * (1 - coupon.value);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      }

      discountAmount = Math.min(discountAmount, originalPrice);
    }

    const totalPrice = originalPrice - discountAmount;
    const totalQuantity = items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);
    const pointsEarned = calcPointsEarned(totalPrice, user.memberLevel);
    const orderNo = await generateOrderNo();
    const pickupNo = await generatePickupNo();
    const estimatedTime = calcEstimatedTime(totalQuantity);

    // Execute transaction
    const order = await prisma.$transaction(async (tx) => {
      // Check and decrement stock
      for (const item of items) {
        const dish = await tx.dish.findUnique({ where: { id: item.dishId } });
        if (!dish || dish.stock < item.quantity) {
          throw new Error(`STOCK_INSUFFICIENT:${dish?.name || item.dishId}`);
        }
        await tx.dish.update({
          where: { id: item.dishId },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }

      // Increment coupon used count
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          pickupNo,
          userId: user.id,
          orderType,
          tableNo: orderType === "dine_in" ? tableNo.trim() : null,
          originalPrice,
          discountAmount,
          totalPrice,
          pointsEarned,
          couponId,
          remark: remark?.trim() || null,
          estimatedTime,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // Add points and update member level
      const newPoints = user.points + pointsEarned;
      const newLevel = getMemberLevel(newPoints);
      await tx.user.update({
        where: { id: user.id },
        data: {
          points: newPoints,
          memberLevel: newLevel,
        },
      });

      // Write point record
      await tx.pointRecord.create({
        data: {
          userId: user.id,
          orderId: newOrder.id,
          type: "earn",
          points: pointsEarned,
          description: `订单 ${orderNo} 消费获得`,
        },
      });

      return newOrder;
    });

    return successResponse(order, 201);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("STOCK_INSUFFICIENT:")) {
      const dishName = error.message.split(":")[1];
      return errorResponse(`${dishName} 库存不足`, "STOCK_INSUFFICIENT", 400);
    }
    return handleAuthError(error);
  }
}
