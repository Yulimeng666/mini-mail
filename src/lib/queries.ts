// 共享数据查询函数 —— 供 Server Component 和 API Route 共用
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** 每页商品数量 */
const PAGE_SIZE = 9;

interface GetProductsParams {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

/** 查询商品列表（搜索 / 分类筛选 / 分页） */
export async function getProducts(params: GetProductsParams) {
  const { search = "", category = "", page = 1, pageSize = PAGE_SIZE } = params;
  const currentPage = Math.max(1, page);

  // 构建查询条件
  const where: Prisma.ProductWhereInput = {
    isActive: true, // 只查上架商品
  };

  // 模糊搜索：SQLite 下 contains 区分大小写
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // 按分类 slug 筛选
  if (category) {
    where.category = { slug: category };
  }

  // 并行查询
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/** 查询所有分类（含商品数量） */
export async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { id: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: c._count.products,
  }));
}
