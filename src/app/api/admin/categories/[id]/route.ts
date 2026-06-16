// 后台分类管理 API — DELETE(删除)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin-auth";

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
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ success: false, message: "无效的分类 ID" }, { status: 400 });
    }

    // 检查是否有商品使用此分类
    const productCount = await prisma.product.count({ where: { categoryId } });
    if (productCount > 0) {
      return NextResponse.json({
        success: false,
        message: `该分类下有 ${productCount} 个商品，无法删除`,
      }, { status: 400 });
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true, message: "分类已删除" });
  } catch (error) {
    console.error("删除分类失败:", error);
    return NextResponse.json({ success: false, message: "删除分类失败" }, { status: 500 });
  }
}
