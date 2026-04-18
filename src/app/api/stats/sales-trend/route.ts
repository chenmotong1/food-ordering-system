import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, handleAuthError } from "@/lib/auth";
import { successResponse } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireManager();
    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "7", 10)));

    const result: Array<{ date: string; totalSales: number; orderCount: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const [agg, count] = await Promise.all([
        prisma.order.aggregate({
          _sum: { totalPrice: true },
          where: {
            orderTime: { gte: dayStart, lte: dayEnd },
            status: { not: "cancelled" },
          },
        }),
        prisma.order.count({
          where: {
            orderTime: { gte: dayStart, lte: dayEnd },
            status: { not: "cancelled" },
          },
        }),
      ]);

      result.push({
        date: d.toISOString().slice(0, 10),
        totalSales: agg._sum.totalPrice || 0,
        orderCount: count,
      });
    }

    return successResponse(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
