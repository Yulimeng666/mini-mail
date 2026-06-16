// iron-session 配置 — Cookie 型 Session 管理
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

/** Session 数据结构 */
export interface SessionData {
  userId?: number;
  role?: string;
}

/** 获取 Session 密钥，生产环境不允许使用默认值 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret || secret === "dev-secret-change-in-production") {
    if (isProd) {
      throw new Error(
        "SESSION_SECRET 环境变量未设置，生产环境必须使用至少 32 位的随机字符串"
      );
    }
    console.warn(
      "⚠ 使用默认 SESSION_SECRET，请在生产环境前更换为随机字符串"
    );
    return "dev-secret-change-in-production";
  }

  // 生产环境下密钥长度检查
  if (isProd && secret.length < 32) {
    throw new Error("SESSION_SECRET 长度不足，生产环境至少需要 32 位");
  }

  return secret;
}

/** iron-session 配置 */
export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: "mini-mail-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: "/",
  },
};

/** 获取当前请求的 Session（Server Component / API Route 通用） */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
