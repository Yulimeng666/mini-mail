// 订单 API — POST(创建订单) / GET(订单列表)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calcFinalTotal, calcDiscount } from "@/lib/membership";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

// ==================== POST — 从购物车创建订单 ====================
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 },
      );
    }

    // 获取购物车（含商品）
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "购物车为空，无法创建订单" },
        { status: 400 },
      );
    }

    // 计算原价 + 准备订单项数据（事务外预计算，事务内二次校验）
    let originalTotal = 0;
    const orderItemsData: Array<{
      productId: number;
      quantity: number;
      price: number;
    }> = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product.isActive) {
        return NextResponse.json(
          { success: false, message: `"${product.name}" 已下架，请先从购物车移除` },
          { status: 400 },
        );
      }

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price, // 下单时价格快照
      });

      originalTotal += product.price * item.quantity;
    }

    // 计算会员折扣
    const discount = calcDiscount(originalTotal, user.membershipLevel);
    const total = calcFinalTotal(originalTotal, user.membershipLevel);

    // 🔒 数据库事务：二次校验库存 → 创建订单 → 扣减库存 → 清空购物车
    const order = await prisma.$transaction(async (tx) => {
      // 1. 二次校验库存（使用 updateMany 的 affected rows 防止 TOCTOU）
      const stockErrors: string[] = [];
      for (const item of orderItemsData) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, stock: true },
          });
          stockErrors.push(
            `"${product?.name || "商品"}" 库存不足（当前库存 ${product?.stock || 0} 件）`,
          );
        }
      }

      if (stockErrors.length > 0) {
        throw new Error(stockErrors.join("；"));
      }

      // 2. 创建订单
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          status: "PENDING",
          originalTotal,
          discount,
          total,
          items: {
            create: orderItemsData,
          },
        },
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

      // 3. 清空购物车
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      message: "订单创建成功",
      data: {
        id: order.id,
        status: order.status,
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
      },
    });
  } catch (error) {
    console.error("创建订单失败:", error);
    // 事务内抛出的库存错误
    if (error instanceof Error && error.message.includes("库存不足")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, message: "创建订单失败，请稍后重试" },
      { status: 500 },
    );
  }
}

// ==================== GET — 我的订单列表（分页） ====================
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 },
      );
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)),
    );

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((order) => ({
          id: order.id,
          status: order.status,
          statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
          originalTotal: order.originalTotal,
          discount: order.discount,
          total: order.total,
          itemCount: order.items.length,
          preview: order.items.slice(0, 3).map((item) => ({
            name: item.product.name,
            image: item.product.image,
          })),
          createdAt: order.createdAt,
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return NextResponse.json(
      { success: false, message: "获取订单列表失败" },
      { status: 500 },
    );
  }
}
