// GET /api/categories — 分类列表（含每个分类下的上架商品数量）
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { id: "asc" },
    });

    // 转换为前端友好的格式
    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: cat._count.products,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json(
      { success: false, message: "获取分类列表失败" },
      { status: 500 }
    );
  }
}
