import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            dish: { select: { id: true, name: true, imageUrl: true } },
          },
        },
        user: {
          select: { id: true, username: true, phone: true },
        },
      },
    });

    if (!order) {
      return errorResponse("订单不存在", "NOT_FOUND", 404);
    }

    // Normal user can only see own orders
    if (user.role === "customer" && order.userId !== user.id) {
      return errorResponse("无权查看此订单", "FORBIDDEN", 403);
    }

    return successResponse(order);
  } catch (error) {
    return handleAuthError(error);
  }
}
