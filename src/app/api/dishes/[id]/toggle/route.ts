import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireManager();
    const { id } = await params;

    const dish = await prisma.dish.findUnique({ where: { id } });
    if (!dish) {
      return errorResponse("菜品不存在", "NOT_FOUND", 404);
    }

    const updated = await prisma.dish.update({
      where: { id },
      data: { isAvailable: !dish.isAvailable },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: "TOGGLE_DISH_AVAILABILITY",
        targetType: "dish",
        targetId: id,
        detail: JSON.stringify({
          name: dish.name,
          isAvailable: updated.isAvailable,
        }),
      },
    });

    return successResponse({ isAvailable: updated.isAvailable });
  } catch (error) {
    return handleAuthError(error);
  }
}
