// 后台订单管理 API — PUT(更新状态)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin-auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

/** 允许的状态流转 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PAID: ["SHIPPED"],
  SHIPPED: ["COMPLETED"],
  PENDING: ["CANCELLED"],
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, message: "无效的订单 ID" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, message: "订单不存在" }, { status: 404 });
    }

    const { status: newStatus } = await request.json();

    if (!newStatus || !["SHIPPED", "COMPLETED", "CANCELLED"].includes(newStatus)) {
      return NextResponse.json({ success: false, message: "无效的目标状态" }, { status: 400 });
    }

    // 检查状态流转是否合法
    const allowedNext = ALLOWED_TRANSITIONS[order.status];
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      return NextResponse.json({
        success: false,
        message: `不能从"${ORDER_STATUS_LABELS[order.status]}"变更为"${ORDER_STATUS_LABELS[newStatus]}"`,
      }, { status: 400 });
    }

    // 取消时恢复库存
    if (newStatus === "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { status: newStatus } });
        const items = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    } else {
      await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
    }

    return NextResponse.json({
      success: true,
      message: `订单状态已更新为"${ORDER_STATUS_LABELS[newStatus]}"`,
      data: { status: newStatus, statusLabel: ORDER_STATUS_LABELS[newStatus] },
    });
  } catch (error) {
    console.error("更新订单失败:", error);
    return NextResponse.json({ success: false, message: "更新订单失败" }, { status: 500 });
  }
}
