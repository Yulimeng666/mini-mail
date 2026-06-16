// 后台商品管理 API — GET(列表) / POST(新增)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin-auth";

// ==================== GET — 商品列表 ====================
export async function GET(request: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 10;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (category) {
      where.categoryId = parseInt(category, 10);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { products, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    return NextResponse.json({ success: false, message: "获取商品列表失败" }, { status: 500 });
  }
}

// ==================== POST — 新增商品 ====================
export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { name, description, price, image, stock, categoryId } = await request.json();

    if (!name || typeof price !== "number" || !categoryId) {
      return NextResponse.json({ success: false, message: "请填写名称、价格和分类" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        price,
        image: image || null,
        stock: stock || 0,
        categoryId,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, message: "商品已新增", data: product });
  } catch (error) {
    console.error("新增商品失败:", error);
    return NextResponse.json({ success: false, message: "新增商品失败" }, { status: 500 });
  }
}
