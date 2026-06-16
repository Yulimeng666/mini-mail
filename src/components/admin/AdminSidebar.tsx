// 后台管理侧边导航 —— Client Component（需 usePathname 高亮当前页）
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "仪表盘", exact: true },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/orders", label: "订单管理" },
  { href: "/admin/categories", label: "分类管理" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="px-4 py-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          后台管理
        </h2>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-blue-600 transition-colors"
        >
          ← 返回前台
        </Link>
      </div>
    </aside>
  );
}
