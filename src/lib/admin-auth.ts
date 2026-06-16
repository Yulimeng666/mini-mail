// 管理员鉴权 — 所有后台 API/页面共用
import { getCurrentUser } from "@/lib/auth";

interface AdminCheckResult {
  authorized: boolean;
  error?: string;
  status?: number;
  user?: Awaited<ReturnType<typeof getCurrentUser>>;
}

/** 验证当前用户是否为管理员，返回统一结构 */
export async function checkAdmin(): Promise<AdminCheckResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { authorized: false, error: "请先登录", status: 401 };
  }

  if (user.role !== "ADMIN") {
    return { authorized: false, error: "需要管理员权限", status: 403 };
  }

  return { authorized: true, user };
}
