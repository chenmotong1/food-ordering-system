import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, handleAuthError } from "@/lib/auth";
import { successResponse } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireManager();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [todayOrders, todaySales, pendingOrders, totalUsers] = await Promise.all([
      prisma.order.count({
        where: { orderTime: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: {
          orderTime: { gte: dayStart, lte: dayEnd },
          status: { not: "cancelled" },
        },
      }),
      prisma.order.count({
        where: { status: "pending" },
      }),
      prisma.user.count(),
    ]);

    return successResponse({
      todayOrders,
      todaySales: todaySales._sum.totalPrice || 0,
      pendingOrders,
      totalUsers,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
