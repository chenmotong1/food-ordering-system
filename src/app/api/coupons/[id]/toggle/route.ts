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

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return errorResponse("优惠券不存在", "NOT_FOUND", 404);
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: "TOGGLE_COUPON",
        targetType: "coupon",
        targetId: id,
        detail: JSON.stringify({ code: coupon.code, isActive: updated.isActive }),
      },
    });

    return successResponse({ isActive: updated.isActive });
  } catch (error) {
    return handleAuthError(error);
  }
}
