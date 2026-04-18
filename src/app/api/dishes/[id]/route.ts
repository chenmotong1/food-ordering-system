import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, requireAdmin, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dish = await prisma.dish.findUnique({
      where: { id },
      include: {
        specs: { orderBy: { sortOrder: "asc" } },
        comboItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!dish) {
      return errorResponse("菜品不存在", "NOT_FOUND", 404);
    }
    return successResponse(dish);
  } catch (error) {
    console.error("GET /api/dishes/[id] error:", error);
    return errorResponse("获取菜品详情失败", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.dish.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("菜品不存在", "NOT_FOUND", 404);
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.subcategory !== undefined) updateData.subcategory = body.subcategory?.trim() || null;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl.trim();
    if (body.tags !== undefined) updateData.tags = typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags || []);
    if (body.calories !== undefined) updateData.calories = body.calories;
    if (body.spicyLevel !== undefined) updateData.spicyLevel = body.spicyLevel;
    if (body.isRecommended !== undefined) updateData.isRecommended = body.isRecommended;
    if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;
    if (body.stock !== undefined) updateData.stock = body.stock;

    const dish = await prisma.dish.update({
      where: { id },
      data: updateData,
      include: { specs: { orderBy: { sortOrder: "asc" } } },
    });

    // Update specs if provided
    if (Array.isArray(body.specs)) {
      await prisma.dishSpec.deleteMany({ where: { dishId: id } });
      if (body.specs.length > 0) {
        await prisma.dishSpec.createMany({
          data: body.specs.map((s: { specType: string; specName: string; priceAdjust: number; isDefault: boolean; sortOrder: number }, i: number) => ({
            dishId: id,
            specType: s.specType,
            specName: s.specName,
            priceAdjust: s.priceAdjust ?? 0,
            isDefault: s.isDefault ?? false,
            sortOrder: s.sortOrder ?? i,
          })),
        });
      }
    }

    const result = await prisma.dish.findUnique({
      where: { id },
      include: { specs: { orderBy: { sortOrder: "asc" } } },
    });

    return successResponse(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.dish.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("菜品不存在", "NOT_FOUND", 404);
    }

    await prisma.dish.delete({ where: { id } });
    return successResponse({ message: "菜品已删除" });
  } catch (error) {
    return handleAuthError(error);
  }
}
