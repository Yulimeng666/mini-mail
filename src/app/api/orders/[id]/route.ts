// 订单详情 API — GET(查看) / PUT(模拟支付 / 取消)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calcMembershipLevel } from "@/lib/membership";
import {
  ORDER_STATUS_LABELS,
  UNCANCELLABLE_STATUSES,
  MEMBERSHIP_LEVEL_NAMES,
} from "@/lib/constants";

// ==================== GET — 订单详情 ====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, message: "无效的订单 ID" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, image: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "订单不存在" },
        { status: 404 },
      );
    }

    // 🔒 只能查看自己的订单
    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "无权查看此订单" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
        originalTotal: order.originalTotal,
        discount: order.discount,
        total: order.total,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.price,
          image: item.product.image,
          quantity: item.quantity,
        })),
        itemCount: order.items.length,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        canCancel: !UNCANCELLABLE_STATUSES.includes(order.status) && order.status !== "CANCELLED",
      },
    });
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return NextResponse.json(
      { success: false, message: "获取订单详情失败" },
      { status: 500 },
    );
  }
}

// ==================== PUT — 模拟支付 / 取消订单 ====================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, message: "无效的订单 ID" },
        { status: 400 },
      );
    }

    const { action } = await request.json();

    if (!action || !["pay", "cancel"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "请指定有效操作（pay 或 cancel）" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "订单不存在" },
        { status: 404 },
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "无权操作此订单" },
        { status: 403 },
      );
    }

    if (action === "pay") {
      // 模拟支付：只能从 PENDING 状态支付
      if (order.status !== "PENDING") {
        const label = ORDER_STATUS_LABELS[order.status] || order.status;
        return NextResponse.json(
          { success: false, message: `当前订单状态为"${label}"，无法支付` },
          { status: 400 },
        );
      }

      // 🔒 事务：原子累加消费金额 + 更新订单状态 + 判断会员升级
      const updated = await prisma.$transaction(async (tx) => {
        // 1. 更新订单状态
        await tx.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
        });

        // 2. 原子累加消费金额（使用 increment 避免竞态覆盖）
        await tx.user.update({
          where: { id: user.id },
          data: { totalSpent: { increment: order.total } },
        });

        // 3. 读取最新累计消费，判断是否升级（只升不降）
        const refreshedUser = await tx.user.findUniqueOrThrow({
          where: { id: user.id },
          select: { totalSpent: true, membershipLevel: true },
        });

        const newLevel = calcMembershipLevel(
          refreshedUser.totalSpent,
          user.membershipLevel, // 当前等级作为保底
        );

        if (newLevel > user.membershipLevel) {
          await tx.user.update({
            where: { id: user.id },
            data: { membershipLevel: newLevel },
          });
        }

        return { newLevel };
      });

      const levelName = MEMBERSHIP_LEVEL_NAMES[updated.newLevel];
      const upgraded = updated.newLevel > user.membershipLevel;

      return NextResponse.json({
        success: true,
        message: upgraded
          ? `支付成功！恭喜升级为${levelName}会员`
          : "支付成功",
        data: {
          status: "PAID",
          statusLabel: ORDER_STATUS_LABELS["PAID"],
          membershipUpgraded: upgraded,
          newLevel: updated.newLevel,
        },
      });
    }

    // action === "cancel"
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "订单已取消" },
        { status: 400 },
      );
    }

    // 已支付之后的订单不可直接取消（需走退款流程）
    if (UNCANCELLABLE_STATUSES.includes(order.status)) {
      const label = ORDER_STATUS_LABELS[order.status] || order.status;
      return NextResponse.json(
        { success: false, message: `${label}订单无法取消，请联系客服处理退款` },
        { status: 400 },
      );
    }

    // 取消 PENDING 订单：恢复库存
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      // 恢复库存
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "订单已取消，库存已恢复",
      data: {
        status: "CANCELLED",
        statusLabel: ORDER_STATUS_LABELS["CANCELLED"],
      },
    });
  } catch (error) {
    console.error("操作订单失败:", error);
    return NextResponse.json(
      { success: false, message: "操作订单失败" },
      { status: 500 },
    );
  }
}
