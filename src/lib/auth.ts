// 认证工具模块 — 密码哈希 / 验证 / Session 管理
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionData } from "@/lib/session";

/** 哈希密码 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** 验证密码 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** 将用户信息写入 Session Cookie */
export async function setSession(userId: number, role: string): Promise<void> {
  const session = await getSession();
  session.userId = userId;
  session.role = role;
  await session.save();
}

/** 从 Cookie 读取当前用户信息（不查数据库） */
export async function getSessionData(): Promise<SessionData> {
  const session = await getSession();
  return {
    userId: session.userId,
    role: session.role,
  };
}

/** 获取当前用户的完整信息（查数据库，不含密码） */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      totalSpent: true,
      membershipLevel: true,
      createdAt: true,
    },
  });

  return user;
}

/** 清除 Cookie（退出登录） */
export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
  await session.save();
}
