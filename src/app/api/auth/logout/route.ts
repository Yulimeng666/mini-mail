// POST /api/auth/logout — 退出登录
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({
      success: true,
      message: "已退出登录",
    });
  } catch (error) {
    console.error("退出登录失败:", error);
    return NextResponse.json(
      { success: false, message: "退出登录失败" },
      { status: 500 }
    );
  }
}
