// 购物车 API — GET(查看) / POST(添加)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCartWithItems, formatCartResponse } from "@/lib/cart";

// ==================== GET — 查看购物车 ====================
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 },
      );
    }

    const cart = await getCartWithItems(user.id);

    return NextResponse.json({
      success: true,
      data: formatCartResponse(cart),
    });
  } catch (error) {
    console.error("获取购物车失败:", error);
    return NextResponse.json(
      { success: false, message: "获取购物车失败" },
      { status: 500 },
    );
  }
}

// ==================== POST — 添加商品到购物车 ====================
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 },
      );
    }

    const { productId, quantity = 1 } = await request.json();

    if (!productId || typeof productId !== "number") {
      return NextResponse.json(
        { success: false, message: "请提供有效的商品 ID" },
        { status: 400 },
      );
    }

    // 验证商品存在且可购买
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, message: "商品不存在或已下架" },
        { status: 404 },
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, message: `库存不足，当前库存 ${product.stock} 件` },
        { status: 400 },
      );
    }

    const cart = await getCartWithItems(user.id);

    // 检查购物车中是否已有该商品
    const existingItem = cart.items.find(
      (item) => item.productId === productId,
    );

    if (existingItem) {
      // 已有 → 增加数量（不超过库存）
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return NextResponse.json(
          { success: false, message: `库存不足，购物车已有 ${existingItem.quantity} 件，库存 ${product.stock} 件` },
          { status: 400 },
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // 新商品 → 创建 CartItem
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // 返回更新后的购物车
    const updatedCart = await getCartWithItems(user.id);

    return NextResponse.json({
      success: true,
      message: "已添加到购物车",
      data: formatCartResponse(updatedCart),
    });
  } catch (error) {
    console.error("添加购物车失败:", error);
    return NextResponse.json(
      { success: false, message: "添加购物车失败" },
      { status: 500 },
    );
  }
}
