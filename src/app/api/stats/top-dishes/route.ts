import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, handleAuthError } from "@/lib/auth";
import { successResponse } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireManager();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where.orderTime = {};
      if (startDate) (where.orderTime as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.orderTime as Record<string, unknown>).lte = new Date(endDate);
    }

    // Get top dishes by salesCount from Dish table
    const dishes = await prisma.dish.findMany({
      orderBy: { salesCount: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true,
        price: true,
        salesCount: true,
      },
    });

    const result = dishes.map((dish) => ({
      ...dish,
      totalRevenue: dish.price * dish.salesCount,
    }));

    return successResponse(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
