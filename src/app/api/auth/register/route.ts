// POST /api/auth/register — 用户注册
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession } from "@/lib/auth";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 🔒 频率限制：同一 IP 每分钟最多 3 次注册
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(`register:${ip}`, {
      windowSeconds: 60,
      maxRequests: 3,
      label: "注册",
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: rateCheck.message },
        { status: 429 }
      );
    }

    const { email, password, name } = await request.json();

    // 校验必填字段
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    // 校验邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 校验密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "密码至少需要 6 位" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已被注册
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 创建用户
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // 注册成功自动登录
    await setSession(user.id, user.role);

    return NextResponse.json({
      success: true,
      message: "注册成功",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { success: false, message: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
