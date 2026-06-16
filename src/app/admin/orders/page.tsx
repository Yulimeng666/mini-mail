// 后台订单管理 —— Client Component
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";

interface OrderRow {
  id: number; userId: number; userName: string; userEmail: string;
  status: string; statusLabel: string;
  originalTotal: number; discount: number; total: number;
  itemCount: number; createdAt: string; updatedAt: string;
}
interface Pagination { page: number; pageSize: number; total: number; totalPages: number; }

/** 允许的状态流转按钮 */
const STATUS_ACTIONS: Record<string, Array<{ label: string; target: string; color: string }>> = {
  PAID: [{ label: "发货", target: "SHIPPED", color: "bg-purple-600 hover:bg-purple-700" }],
  SHIPPED: [{ label: "完成", target: "COMPLETED", color: "bg-green-600 hover:bg-green-700" }],
  PENDING: [{ label: "取消", target: "CANCELLED", color: "bg-red-500 hover:bg-red-600" }],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 15, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleStatusChange(orderId: number, newStatus: string) {
    if (!confirm(`确定将订单 #${orderId} 标记为"${ORDER_STATUS_LABELS[newStatus]}"？`)) return;
    setActingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) fetchOrders(pagination.page);
      else alert(data.message);
    } catch { alert("网络错误"); }
    finally { setActingId(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">订单管理</h1>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <option value="">全部状态</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">订单号</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">用户</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500">金额</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">状态</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">时间</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">暂无订单</td></tr>
            ) : orders.map((o) => {
              const actions = STATUS_ACTIONS[o.status] || [];
              return (
                <tr key={o.id} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="text-blue-600 hover:underline font-medium">#{o.id}</Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-white">
                    <div className="text-sm">{o.userName}</div>
                    <div className="text-xs text-zinc-400">{o.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-red-600 dark:text-red-400 font-medium">{formatPrice(o.total)}</div>
                    {o.discount > 0 && <div className="text-xs text-zinc-400 line-through">{formatPrice(o.originalTotal)}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${ORDER_STATUS_COLORS[o.status] || ""}`}>
                      {o.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {new Date(o.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {actions.map((action) => (
                      <button key={action.target} onClick={() => handleStatusChange(o.id, action.target)}
                        disabled={actingId === o.id}
                        className={`text-xs text-white rounded-full px-3 py-1 font-medium transition-colors disabled:opacity-50 cursor-pointer ${action.color}`}>
                        {actingId === o.id ? "..." : action.label}
                      </button>
                    ))}
                    {actions.length === 0 && <span className="text-xs text-zinc-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button onClick={() => fetchOrders(pagination.page - 1)} disabled={pagination.page <= 1}
            className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 dark:text-zinc-400 cursor-pointer disabled:cursor-default">上一页</button>
          <span className="text-zinc-500">{pagination.page} / {pagination.totalPages}</span>
          <button onClick={() => fetchOrders(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 dark:text-zinc-400 cursor-pointer disabled:cursor-default">下一页</button>
        </div>
      )}
    </div>
  );
}
