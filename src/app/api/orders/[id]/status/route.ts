import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireRole, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStaff();
    const { id } = await params;
    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return errorResponse("请提供新状态", "VALIDATION_ERROR", 400);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return errorResponse("订单不存在", "NOT_FOUND", 404);
    }

    const currentStatus = order.status;

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[currentStatus];
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      return errorResponse(
        `订单状态只能从 ${currentStatus} 变更为 ${(allowedNext || []).join(" 或 ")}`,
        "ORDER_STATUS_INVALID",
        400
      );
    }

    // Role-based restrictions
    if (newStatus === "cancelled" || newStatus === "completed") {
      // Only manager/admin can cancel or complete
      if (user.role === "employee") {
        return errorResponse("权限不足", "FORBIDDEN", 403);
      }
    }

    // Update order
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "completed") {
      updateData.completedTime = new Date();
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    // If cancelled, restore stock
    if (newStatus === "cancelled") {
      await prisma.$transaction(
        order.items.map((item) =>
          prisma.dish.update({
            where: { id: item.dishId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: "UPDATE_ORDER_STATUS",
        targetType: "order",
        targetId: id,
        detail: JSON.stringify({
          orderNo: order.orderNo,
          from: currentStatus,
          to: newStatus,
        }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}
