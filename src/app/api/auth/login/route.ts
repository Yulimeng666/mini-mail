// POST /api/auth/login — 用户登录
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSession } from "@/lib/auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 🔒 频率限制：同一 IP 每分钟最多 5 次登录尝试
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(`login:${ip}`, {
      windowSeconds: 60,
      maxRequests: 5,
      label: "登录",
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: rateCheck.message },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "请填写邮箱和密码" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { email } });

    // 🔒 安全：不区分"用户不存在"和"密码错误"，防止撞库攻击
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { success: false, message: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 写入 Session
    await setSession(user.id, user.role);

    return NextResponse.json({
      success: true,
      message: "登录成功",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json(
      { success: false, message: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
