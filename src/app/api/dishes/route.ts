import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const recommended = searchParams.get("recommended");
    const keyword = searchParams.get("keyword");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Record<string, unknown> = {};

    // Default: only available dishes for customers
    const available = searchParams.get("available");
    if (available !== "false") {
      where.isAvailable = true;
    }

    if (category && category !== "all") {
      if (category === "recommended") {
        where.isRecommended = true;
      } else {
        where.category = category;
      }
    }
    if (subcategory) where.subcategory = subcategory;
    if (recommended === "true") where.isRecommended = true;
    if (keyword) {
      where.name = { contains: keyword };
    }

    const [items, total] = await Promise.all([
      prisma.dish.findMany({
        where,
        include: {
          specs: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { salesCount: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dish.count({ where }),
    ]);

    return successResponse({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/dishes error:", error);
    return errorResponse("获取菜品列表失败", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireManager();
    const body = await req.json();

    const {
      name,
      category,
      subcategory,
      price,
      description,
      imageUrl,
      tags,
      calories,
      spicyLevel,
      isRecommended,
      isAvailable,
      stock,
      specs,
    } = body;

    if (!name?.trim() || !category?.trim() || !imageUrl?.trim()) {
      return errorResponse("菜品名称、分类和图片为必填项", "VALIDATION_ERROR", 400);
    }
    if (typeof price !== "number" || price < 0) {
      return errorResponse("价格必须为非负数字", "VALIDATION_ERROR", 400);
    }

    const dish = await prisma.dish.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        subcategory: subcategory?.trim() || null,
        price,
        description: description?.trim() || null,
        imageUrl: imageUrl.trim(),
        tags: typeof tags === "string" ? tags : JSON.stringify(tags || []),
        calories: typeof calories === "number" ? calories : null,
        spicyLevel: typeof spicyLevel === "number" ? spicyLevel : 0,
        isRecommended: isRecommended === true,
        isAvailable: isAvailable !== false,
        stock: typeof stock === "number" ? stock : 999,
      },
      include: { specs: true },
    });

    // Create specs if provided
    if (Array.isArray(specs) && specs.length > 0) {
      await prisma.dishSpec.createMany({
        data: specs.map((s: { specType: string; specName: string; priceAdjust: number; isDefault: boolean; sortOrder: number }, i: number) => ({
          dishId: dish.id,
          specType: s.specType,
          specName: s.specName,
          priceAdjust: s.priceAdjust ?? 0,
          isDefault: s.isDefault ?? false,
          sortOrder: s.sortOrder ?? i,
        })),
      });
    }

    const result = await prisma.dish.findUnique({
      where: { id: dish.id },
      include: { specs: { orderBy: { sortOrder: "asc" } } },
    });

    return successResponse(result, 201);
  } catch (error) {
    return handleAuthError(error);
  }
}
