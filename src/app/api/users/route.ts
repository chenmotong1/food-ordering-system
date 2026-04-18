import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth";
import { successResponse } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const keyword = searchParams.get("keyword");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          phone: true,
          email: true,
          role: true,
          points: true,
          memberLevel: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Mask phone numbers
    const maskedItems = items.map((u) => ({
      ...u,
      phone: u.phone.slice(0, 3) + "****" + u.phone.slice(7),
    }));

    return successResponse({
      items: maskedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
