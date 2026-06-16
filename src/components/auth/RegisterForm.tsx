// 注册表单 —— Client Component
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("请填写所有必填字段");
      return;
    }

    // 密码强度校验
    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }
    if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
      setError("密码需包含至少一个英文字母");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("密码需包含至少一个数字");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-8">
        注册
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            姓名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm
                       text-zinc-900 placeholder-zinc-400 outline-none
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm
                       text-zinc-900 placeholder-zinc-400 outline-none
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位，需包含字母和数字"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm
                       text-zinc-900 placeholder-zinc-400 outline-none
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium
                     hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? "注册中..." : "注册"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        已有账号？
        <Link href="/auth/login" className="text-blue-600 hover:underline ml-1">
          立即登录
        </Link>
      </p>
    </div>
  );
}
