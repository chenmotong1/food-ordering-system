import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    const validRoles = ["customer", "employee", "manager", "admin"];
    if (!validRoles.includes(role)) {
      return errorResponse("无效的角色", "VALIDATION_ERROR", 400);
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return errorResponse("用户不存在", "NOT_FOUND", 404);
    }

    // Prevent admin from demoting themselves
    if (id === admin.id && role !== "admin") {
      return errorResponse("不能降级自己的管理员权限", "FORBIDDEN", 403);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_USER_ROLE",
        targetType: "user",
        targetId: id,
        detail: JSON.stringify({
          username: targetUser.username,
          from: targetUser.role,
          to: role,
        }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}
