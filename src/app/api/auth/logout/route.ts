import { successResponse } from "@/lib/utils";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return successResponse({ message: "已退出登录" });
}
