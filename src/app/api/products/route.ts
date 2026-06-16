// GET /api/products — 商品列表（搜索 / 分类筛选 / 分页）
import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const result = await getProducts({ search, category, page });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    return NextResponse.json(
      { success: false, message: "获取商品列表失败" },
      { status: 500 }
    );
  }
}
