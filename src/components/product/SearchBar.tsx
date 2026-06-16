// 搜索栏组件 —— Client Component（需要 input 状态）
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") || "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 防抖搜索：输入停止 400ms 后自动跳转
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);

      // 清除上一次的定时器，实现真正的防抖
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (v) {
          params.set("search", v);
        } else {
          params.delete("search");
        }
        params.delete("page"); // 重置到第一页
        router.push(`${pathname}?${params.toString()}`);
      }, 400);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="relative w-full max-w-md">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="搜索商品..."
        className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm
                   text-zinc-900 placeholder-zinc-400 outline-none
                   transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                   dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </div>
  );
}
