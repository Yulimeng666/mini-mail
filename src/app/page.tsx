// 首页 —— 商品网格展示 + 搜索 + 分类标签 + 分页
import { Suspense } from "react";
import { getProducts, getCategories } from "@/lib/queries";
import { ProductCard } from "@/components/product/ProductCard";
import { SearchBar } from "@/components/product/SearchBar";
import { CategoryTabs } from "@/components/product/CategoryTabs";
import { Pagination } from "@/components/product/Pagination";

interface HomePageProps {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const page = parseInt(params.page || "1", 10);

  // 并行查询：商品列表 + 分类列表
  const [{ products, pagination }, categories] = await Promise.all([
    getProducts({ search, category, page }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        🛍️ 全部商品
      </h1>

      {/* 搜索栏 + 分类标签 */}
      <div className="flex flex-col gap-4 mb-6">
        {/* useSearchParams 需要 Suspense 边界 */}
        <Suspense fallback={
          <div className="h-10 w-full max-w-md rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        }>
          <SearchBar />
        </Suspense>
        <CategoryTabs categories={categories} />
      </div>

      {/* 搜索结果提示 */}
      {search && (
        <p className="text-sm text-zinc-500 mb-4">
          搜索 &ldquo;{search}&rdquo; 找到 {pagination.total} 件商品
        </p>
      )}

      {/* 商品网格 */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              category={product.category}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <span className="text-5xl mb-4">🔍</span>
          <p className="text-lg">没有找到相关商品</p>
          {search && <p className="text-sm mt-1">试试其他关键词吧</p>}
        </div>
      )}

      {/* 分页 */}
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} />
    </div>
  );
}
