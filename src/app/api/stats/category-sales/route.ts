import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, handleAuthError } from "@/lib/auth";
import { successResponse } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/types";

export async function GET(req: NextRequest) {
  try {
    await requireManager();

    const dishes = await prisma.dish.findMany({
      select: { category: true, price: true, salesCount: true },
    });

    const categoryMap: Record<string, number> = {};
    let totalSales = 0;

    for (const dish of dishes) {
      const revenue = dish.price * dish.salesCount;
      const cat = CATEGORY_LABELS[dish.category] || dish.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + revenue;
      totalSales += revenue;
    }

    const result = Object.entries(categoryMap).map(([category, sales]) => ({
      category,
      sales: Math.round(sales * 100) / 100,
      percentage: totalSales > 0 ? Math.round((sales / totalSales) * 10000) / 100 : 0,
    }));

    return successResponse(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
