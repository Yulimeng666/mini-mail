// 分页组件 —— Client Component
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  /** 构建分页链接，保留现有搜索和分类参数 */
  function buildPageUrl(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return "/" + (qs ? `?${qs}` : "");
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {/* 上一页 */}
      {currentPage > 1 && (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100
                     dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        >
          上一页
        </Link>
      )}

      {/* 页码按钮 */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={buildPageUrl(page)}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            page === currentPage
              ? "bg-blue-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          )}
        >
          {page}
        </Link>
      ))}

      {/* 下一页 */}
      {currentPage < totalPages && (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100
                     dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        >
          下一页
        </Link>
      )}
    </div>
  );
}
