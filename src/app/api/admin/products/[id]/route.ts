// 后台商品管理 API — PUT(编辑) / DELETE(删除)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin-auth";

// ==================== PUT — 更新商品 ====================
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
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ success: false, message: "无效的商品 ID" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "商品不存在" }, { status: 404 });
    }

    const { name, description, price, image, stock, isActive, categoryId } = await request.json();

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        price: typeof price === "number" ? price : existing.price,
        image: image !== undefined ? image : existing.image,
        stock: typeof stock === "number" ? stock : existing.stock,
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
        categoryId: categoryId ?? existing.categoryId,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, message: "商品已更新", data: product });
  } catch (error) {
    console.error("更新商品失败:", error);
    return NextResponse.json({ success: false, message: "更新商品失败" }, { status: 500 });
  }
}

// ==================== DELETE — 删除商品 ====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ success: false, message: "无效的商品 ID" }, { status: 400 });
    }

    // 检查是否有关联订单，有则建议下架而非删除
    const [orderRefs, cartRefs] = await Promise.all([
      prisma.orderItem.count({ where: { productId } }),
      prisma.cartItem.count({ where: { productId } }),
    ]);

    if (orderRefs > 0) {
      return NextResponse.json({
        success: false,
        message: `该商品已被 ${orderRefs} 个订单引用，无法删除。建议改为下架处理`,
      }, { status: 400 });
    }

    // 清理购物车中的引用后删除
    if (cartRefs > 0) {
      await prisma.cartItem.deleteMany({ where: { productId } });
    }

    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ success: true, message: "商品已删除" });
  } catch (error) {
    console.error("删除商品失败:", error);
    return NextResponse.json({ success: false, message: "删除商品失败" }, { status: 500 });
  }
}
