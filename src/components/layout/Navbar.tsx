// 顶部导航栏 —— 异步 Server Component，自动感知登录状态
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { UserMenu } from "./UserMenu";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-white">
          <span className="text-2xl">📦</span>
          Mini Mail
        </Link>

        {/* 右侧：导航链接 + 用户状态 */}
        <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            首页
          </Link>

          {user ? (
            <>
              <Link href="/cart" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                购物车
              </Link>
              <Link href="/orders" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                我的订单
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-white text-sm font-medium hover:bg-zinc-700 transition-colors dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  后台
                </Link>
              )}
              <UserMenu name={user.name} membershipLevel={user.membershipLevel} />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
