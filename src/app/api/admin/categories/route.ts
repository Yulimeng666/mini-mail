// 后台分类管理 API — GET(列表) / POST(新增)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
      })),
    });
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json({ success: false, message: "获取分类列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ success: false, message: "请填写分类名称和标识" }, { status: 400 });
    }

    // 检查唯一性
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "分类名称或标识已存在" }, { status: 409 });
    }

    const category = await prisma.category.create({ data: { name, slug } });

    return NextResponse.json({
      success: true,
      message: "分类已新增",
      data: { id: category.id, name: category.name, slug: category.slug, productCount: 0 },
    });
  } catch (error) {
    console.error("新增分类失败:", error);
    return NextResponse.json({ success: false, message: "新增分类失败" }, { status: 500 });
  }
}
