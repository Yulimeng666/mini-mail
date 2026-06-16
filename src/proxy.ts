// 路由权限拦截 —— Next.js 16 中 middleware.ts 重命名为 proxy.ts
// 保护需登录路由和 API，以及管理员路由和 API
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

/** 需要登录才能访问的路由前缀（使用精确 + 子路径匹配） */
const AUTH_ROUTES = ["/cart", "/checkout", "/orders"];

/** 需要管理员权限的路由前缀 */
const ADMIN_ROUTES = ["/admin"];

/** 需要管理员权限的 API 路由前缀 */
const ADMIN_API_ROUTES = ["/api/admin"];

/** 判断路径是否匹配指定前缀（仅匹配完整路径段，避免 /cartography 误匹配 /cart） */
function pathMatches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = AUTH_ROUTES.some((r) => pathMatches(pathname, r));
  const needsAdmin = ADMIN_ROUTES.some((r) => pathMatches(pathname, r));
  const needsAdminApi = ADMIN_API_ROUTES.some((r) => pathMatches(pathname, r));

  // 公开路由直接放行
  if (!needsAuth && !needsAdmin && !needsAdminApi) {
    return NextResponse.next();
  }

  // 检查 session cookie 是否存在（快速路径，避免不必要的解密）
  const cookieValue = request.cookies.get(sessionOptions.cookieName)?.value;
  if (!cookieValue) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 解密 session cookie 读取 userId 和 role
    const session = await getIronSession<SessionData>(
      request.cookies,
      sessionOptions,
    );

    if (!session.userId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 管理员路由和 API 额外检查 role
    if ((needsAdmin || needsAdminApi) && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    // Cookie 解密失败（过期/篡改/密钥变更）
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

/** 拦截需要保护的路由和 API */
export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
