// 分类标签组件 —— Client Component（需要交互状态）
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

interface CategoryTabsProps {
  categories: Category[];
}

export function CategoryTabs({ categories }: CategoryTabsProps) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 全部商品 —— 清空分类筛选 */}
      <Link
        href="/"
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          !activeCategory
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
        )}
      >
        全部
      </Link>

      {/* 各分类标签 */}
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        return (
          <Link
            key={cat.id}
            href={`/?category=${cat.slug}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            )}
          >
            {cat.name}
            <span className="ml-1 text-xs opacity-70">({cat.productCount})</span>
          </Link>
        );
      })}
    </div>
  );
}
