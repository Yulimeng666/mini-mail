// 用户菜单 —— Client Component（退出登录需要客户端交互）
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserMenuProps {
  name: string;
  membershipLevel: number;
}

/** 心悦等级标签映射 */
const LEVEL_LABELS: Record<number, string> = {
  0: "",
  1: "心悦一级",
  2: "心悦二级",
  3: "心悦三级",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  2: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  3: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function UserMenu({ name, membershipLevel }: UserMenuProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const levelLabel = LEVEL_LABELS[membershipLevel];

  return (
    <div className="flex items-center gap-3">
      {/* 用户名 + 会员等级 */}
      <span className="text-sm text-zinc-700 dark:text-zinc-300">
        {name}
      </span>
      {levelLabel && (
        <span
          className={`text-xs rounded-full px-2 py-0.5 font-medium ${LEVEL_COLORS[membershipLevel] || ""}`}
        >
          {levelLabel}
        </span>
      )}

      {/* 退出按钮 */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-sm text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loggingOut ? "退出中..." : "退出"}
      </button>
    </div>
  );
}
