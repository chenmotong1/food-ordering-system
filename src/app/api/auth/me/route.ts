import { getCurrentUser, handleAuthError } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("请先登录", "AUTH_REQUIRED", 401);
    }
    return successResponse(user);
  } catch (error) {
    return handleAuthError(error);
  }
}
