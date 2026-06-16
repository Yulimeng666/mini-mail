// 购物车单项 API — PUT(修改数量) / DELETE(移除商品)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCartWithItems, formatCartResponse } from "@/lib/cart";

// ==================== PUT — 修改商品数量 ====================
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
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, message: "无效的商品项 ID" },
        { status: 400 },
      );
    }

    const { quantity } = await request.json();

    if (typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { success: false, message: "数量必须为大于 0 的整数" },
        { status: 400 },
      );
    }

    // 验证该 CartItem 属于当前用户
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, product: true },
    });

    if (!cartItem || cartItem.cart.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "购物车项不存在" },
        { status: 404 },
      );
    }

    // 检查库存
    if (quantity > cartItem.product.stock) {
      return NextResponse.json(
        { success: false, message: `库存不足，当前库存 ${cartItem.product.stock} 件` },
        { status: 400 },
      );
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // 返回更新后的完整购物车
    const cart = await getCartWithItems(user.id);

    return NextResponse.json({
      success: true,
      message: "已更新数量",
      data: formatCartResponse(cart),
    });
  } catch (error) {
    console.error("更新购物车失败:", error);
    return NextResponse.json(
      { success: false, message: "更新购物车失败" },
      { status: 500 },
    );
  }
}

// ==================== DELETE — 移除购物车商品 ====================
export async function DELETE(
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
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, message: "无效的商品项 ID" },
        { status: 400 },
      );
    }

    // 验证该 CartItem 属于当前用户
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "购物车项不存在" },
        { status: 404 },
      );
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    // 返回更新后的完整购物车
    const cart = await getCartWithItems(user.id);

    return NextResponse.json({
      success: true,
      message: "已从购物车移除",
      data: formatCartResponse(cart),
    });
  } catch (error) {
    console.error("移除购物车商品失败:", error);
    return NextResponse.json(
      { success: false, message: "移除购物车商品失败" },
      { status: 500 },
    );
  }
}
