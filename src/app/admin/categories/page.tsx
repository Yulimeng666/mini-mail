// 后台分类管理 —— Client Component
"use client";

import { useState, useEffect, useCallback } from "react";

interface Category {
  id: number; name: string; slug: string; productCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增表单
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !slug) {
      setError("请填写分类名称和标识"); return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (data.success) {
        setName(""); setSlug("");
        fetchCategories();
      } else {
        setError(data.message);
      }
    } catch {
      setError("网络错误");
    } finally { setAdding(false); }
  }

  async function handleDelete(id: number, categoryName: string) {
    if (!confirm(`确定删除分类"${categoryName}"？`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchCategories();
      else alert(data.message);
    } catch { alert("网络错误"); }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">分类管理</h1>

      {/* 新增表单 */}
      <form onSubmit={handleAdd} className="mb-8 flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">分类名称</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="如：手机数码"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 w-40" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">标识 (slug)</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
            placeholder="如：phone-digital"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 w-48" />
        </div>
        <button type="submit" disabled={adding}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
          {adding ? "添加中..." : "新增分类"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </form>

      {/* 分类列表 */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">名称</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">标识</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">商品数</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-400">加载中...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-400">暂无分类</td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="bg-white dark:bg-zinc-900">
                <td className="px-4 py-3 text-zinc-400">#{c.id}</td>
                <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">{c.name}</td>
                <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">{c.productCount}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleDelete(c.id, c.name)} disabled={c.productCount > 0}
                    className="text-xs text-red-500 hover:underline disabled:text-zinc-300 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                    title={c.productCount > 0 ? "该分类下有商品，无法删除" : undefined}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
