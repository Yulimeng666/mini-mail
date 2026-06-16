// 后台商品管理 —— Client Component
"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";

interface Category { id: number; name: string; slug: string; productCount: number; }
interface Product {
  id: number; name: string; price: number; stock: number; isActive: boolean;
  image: string | null; description: string;
  category: { id: number; name: string }; createdAt: string;
}
interface Pagination { page: number; pageSize: number; total: number; totalPages: number; }

type FormMode = "closed" | "add" | "edit";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // 表单状态
  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (search) params.set("search", search);
      if (filterCategory) params.set("category", filterCategory);
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search, filterCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

  function openAddForm() {
    fetchCategories(); // 每次打开表单前刷新分类列表
    setFormMode("add"); setEditId(null); setFormName(""); setFormPrice(""); setFormStock("0");
    setFormDesc(""); setFormImage(""); setFormCategoryId("");
    setFormActive(true); setFormError("");
  }

  function openEditForm(p: Product) {
    setFormMode("edit"); setEditId(p.id); setFormName(p.name); setFormPrice(String(p.price));
    setFormStock(String(p.stock)); setFormDesc(p.description); setFormImage(p.image || "");
    setFormCategoryId(String(p.category.id)); setFormActive(p.isActive); setFormError("");
  }

  function closeForm() { setFormMode("closed"); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formName || !formPrice || !formCategoryId) {
      setFormError("请填写名称、价格和分类"); return;
    }

    setSubmitting(true);
    try {
      const url = formMode === "add" ? "/api/admin/products" : `/api/admin/products/${editId}`;
      const method = formMode === "add" ? "POST" : "PUT";
      const body = {
        name: formName, price: parseFloat(formPrice), stock: parseInt(formStock, 10) || 0,
        description: formDesc, image: formImage || null, categoryId: parseInt(formCategoryId, 10),
        isActive: formActive,
      };

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        closeForm();
        fetchProducts(pagination.page);
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除此商品？")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchProducts(pagination.page);
      else alert(data.message);
    } catch { alert("网络错误"); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">商品管理</h1>
        <button onClick={openAddForm} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer">
          + 新增商品
        </button>
      </div>

      {/* 搜索筛选 */}
      <div className="flex gap-3 mb-6">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索商品名称..." onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <option value="">全部分类</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => fetchProducts()} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 cursor-pointer">
          搜索
        </button>
      </div>

      {/* 表单弹窗 */}
      {formMode !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeForm}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
              {formMode === "add" ? "新增商品" : "编辑商品"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">名称 *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">价格 *</label>
                  <input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">库存</label>
                  <input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">分类 *</label>
                  <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">状态</label>
                  <label className="flex items-center gap-2 py-2 cursor-pointer">
                    <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">上架</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">描述</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">图片 URL</label>
                <input type="text" value={formImage} onChange={(e) => setFormImage(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
            </div>
            {formError && <p className="mt-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{formError}</p>}
            <div className="mt-4 flex gap-3 justify-end">
              <button type="button" onClick={closeForm}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 cursor-pointer">取消</button>
              <button type="submit" disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {submitting ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">商品</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">价格</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">库存</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">分类</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">状态</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-400">加载中...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-400">暂无商品</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3 text-zinc-400">#{p.id}</td>
                <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium max-w-48 truncate">{p.name}</td>
                <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-medium">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{p.stock}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{p.category.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs rounded-full px-2 py-0.5 ${p.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-400"}`}>
                    {p.isActive ? "上架" : "下架"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openEditForm(p)} className="text-xs text-blue-600 hover:underline mr-3 cursor-pointer">编辑</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:underline cursor-pointer">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button onClick={() => fetchProducts(pagination.page - 1)} disabled={pagination.page <= 1}
            className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 dark:text-zinc-400 cursor-pointer disabled:cursor-default">上一页</button>
          <span className="text-zinc-500">{pagination.page} / {pagination.totalPages}</span>
          <button onClick={() => fetchProducts(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 dark:text-zinc-400 cursor-pointer disabled:cursor-default">下一页</button>
        </div>
      )}
    </div>
  );
}
