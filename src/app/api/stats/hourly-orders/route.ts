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

    const orders = await prisma.order.findMany({
      where: {
        orderTime: { gte: dayStart, lte: dayEnd },
        status: { not: "cancelled" },
      },
      select: { orderTime: true, totalPrice: true },
    });

    const hourlyData: Array<{ hour: number; count: number; sales: number }> = [];
    for (let h = 0; h < 24; h++) {
      hourlyData.push({ hour: h, count: 0, sales: 0 });
    }

    for (const order of orders) {
      const hour = order.orderTime.getHours();
      hourlyData[hour].count++;
      hourlyData[hour].sales += order.totalPrice;
    }

    return successResponse(hourlyData);
  } catch (error) {
    return handleAuthError(error);
  }
}
