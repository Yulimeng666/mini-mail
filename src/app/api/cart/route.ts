// 购物车 API — GET(查看) / POST(添加) / PATCH(修改数量) / DELETE(移除商品)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/** 获取或创建当前用户的购物车 */
async function getOrCreateCart(userId: number) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              stock: true,
              isActive: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                stock: true,
                isActive: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  return cart;
}

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

    const cart = await getOrCreateCart(user.id);

    // 计算总价
    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          stock: item.product.stock,
          isActive: item.product.isActive,
          quantity: item.quantity,
        })),
        total,
        itemCount: cart.items.length,
      },
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

    const cart = await getOrCreateCart(user.id);

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
    const updatedCart = await getOrCreateCart(user.id);
    const total = updatedCart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return NextResponse.json({
      success: true,
      message: "已添加到购物车",
      data: {
        items: updatedCart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          stock: item.product.stock,
          isActive: item.product.isActive,
          quantity: item.quantity,
        })),
        total,
        itemCount: updatedCart.items.length,
      },
    });
  } catch (error) {
    console.error("添加购物车失败:", error);
    return NextResponse.json(
      { success: false, message: "添加购物车失败" },
      { status: 500 },
    );
  }
}

// ==================== PATCH — 修改商品数量 ====================
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 },
      );
    }

    const { itemId, quantity } = await request.json();

    if (!itemId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { success: false, message: "请提供有效的商品项 ID 和数量（≥1）" },
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

    // 返回更新后的购物车
    const cart = await getOrCreateCart(user.id);
    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return NextResponse.json({
      success: true,
      message: "已更新数量",
      data: {
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          stock: item.product.stock,
          isActive: item.product.isActive,
          quantity: item.quantity,
        })),
        total,
        itemCount: cart.items.length,
      },
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
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 },
      );
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: "请提供商品项 ID" },
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

    // 返回更新后的购物车
    const cart = await getOrCreateCart(user.id);
    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return NextResponse.json({
      success: true,
      message: "已从购物车移除",
      data: {
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          stock: item.product.stock,
          isActive: item.product.isActive,
          quantity: item.quantity,
        })),
        total,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    console.error("移除购物车商品失败:", error);
    return NextResponse.json(
      { success: false, message: "移除购物车商品失败" },
      { status: 500 },
    );
  }
}
