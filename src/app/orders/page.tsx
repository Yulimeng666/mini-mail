// 我的订单列表 —— Client Component
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";

interface OrderPreview {
  id: number;
  status: string;
  statusLabel: string;
  originalTotal: number;
  discount: number;
  total: number;
  itemCount: number;
  preview: Array<{ name: string; image: string | null }>;
  createdAt: string;
}

interface OrdersData {
  orders: OrderPreview[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrdersData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?page=${page}&pageSize=10`);
      if (res.status === 401) {
        router.push("/auth/login?redirect=/orders");
        return;
      }
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch {
      console.error("加载订单列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">
        加载中...
      </div>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-8xl mb-6">📋</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          暂无订单
        </h1>
        <p className="text-zinc-500 mb-6">下单后订单将显示在这里</p>
        <Link
          href="/"
          className="inline-flex rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          去逛逛
        </Link>
      </div>
    );
  }

  const { orders, pagination } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
        我的订单
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block rounded-2xl border border-zinc-200 bg-white p-5
                       hover:border-blue-300 hover:shadow-sm transition-all
                       dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            {/* 订单头部：编号 + 状态 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">
                订单 #{order.id}
              </span>
              <span
                className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.PENDING}`}
              >
                {order.statusLabel || ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>

            {/* 商品预览（最多 3 个） */}
            <div className="flex items-center gap-2 mb-3">
              {order.preview.map((item, i) => (
                <div
                  key={i}
                  className="h-10 w-10 flex-shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-400"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    "📦"
                  )}
                </div>
              ))}
              {order.itemCount > 3 && (
                <span className="text-xs text-zinc-400">
                  +{order.itemCount - 3} 件
                </span>
              )}
            </div>

            {/* 底部：金额 + 时间 */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatPrice(order.total)}
                </span>
                {order.discount > 0 && (
                  <span className="text-xs text-zinc-400 line-through">
                    {formatPrice(order.originalTotal)}
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(order.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg px-3 py-1.5 text-sm transition-colors
                       text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300
                       dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-default"
          >
            上一页
          </button>
          <span className="text-sm text-zinc-500">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg px-3 py-1.5 text-sm transition-colors
                       text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300
                       dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-default"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
