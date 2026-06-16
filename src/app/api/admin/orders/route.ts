// 后台订单管理 API — GET(所有订单列表)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin-auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 15;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((o) => ({
          id: o.id,
          userId: o.userId,
          userName: o.user.name,
          userEmail: o.user.email,
          status: o.status,
          statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
          originalTotal: o.originalTotal,
          discount: o.discount,
          total: o.total,
          itemCount: o.items.length,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        })),
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return NextResponse.json({ success: false, message: "获取订单列表失败" }, { status: 500 });
  }
}
