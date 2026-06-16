// 购物车共享函数 — 供 cart API 多个路由文件使用
import { prisma } from "@/lib/prisma";

/** 获取或创建当前用户的购物车（含所有商品项） */
export async function getCartWithItems(userId: number) {
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

/** 将购物车数据序列化为 API 响应格式 */
export function formatCartResponse(
  cart: Awaited<ReturnType<typeof getCartWithItems>>,
) {
  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return {
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
  };
}
