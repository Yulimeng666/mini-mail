// 订单详情页 —— Client Component
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

interface OrderDetail {
  id: number;
  status: string;
  statusLabel: string;
  originalTotal: number;
  discount: number;
  total: number;
  items: OrderItem[];
  itemCount: number;
  canCancel: boolean;
  createdAt: string;
  updatedAt: string;
}

import { ORDER_STATUS_COLORS } from "@/lib/constants";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 401) {
        router.push(`/auth/login?redirect=/orders/${orderId}`);
        return;
      }
      if (res.status === 403 || res.status === 404) {
        setOrder(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch {
      console.error("加载订单详情失败");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // 模拟支付
  async function handlePay() {
    if (!confirm("确认支付此订单？")) return;
    setActing(true);
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchOrder();
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setActing(false);
    }
  }

  // 取消订单
  async function handleCancel() {
    if (!confirm("确定取消此订单？取消后将恢复商品库存。")) return;
    setActing(true);
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchOrder();
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">
        加载中...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          订单不存在
        </h1>
        <Link href="/orders" className="text-blue-600 hover:underline">
          返回订单列表
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/orders" className="text-sm text-zinc-400 hover:text-blue-600 transition-colors">
            ← 返回订单列表
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            订单 #{order.id}
          </h1>
        </div>
        <span
          className={`text-sm rounded-full px-3 py-1 font-medium ${ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.PENDING}`}
        >
          {order.statusLabel}
        </span>
      </div>

      {/* 提示消息 */}
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {message}
        </div>
      )}

      {/* 商品明细 */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-white">
            商品明细 ({order.itemCount} 件)
          </h2>
        </div>

        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 px-5 py-4 border-b border-zinc-50 dark:border-zinc-800/50 last:border-b-0"
          >
            {/* 商品图片 */}
            <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  📦
                </div>
              )}
            </div>

            {/* 名称 + 单价 */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.productId}`}
                className="text-sm font-medium text-zinc-900 dark:text-white hover:text-blue-600 line-clamp-1"
              >
                {item.name}
              </Link>
              <p className="text-xs text-zinc-500 mt-0.5">
                {formatPrice(item.price)} × {item.quantity}
              </p>
            </div>

            {/* 小计 */}
            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 金额汇总 */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 mb-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>商品原价</span>
            <span>{formatPrice(order.originalTotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>会员折扣</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-500">
            <span>运费</span>
            <span>免运费</span>
          </div>
          <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-white pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span>实付款</span>
            <span className="text-red-600 dark:text-red-400">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {order.status === "PENDING" && (
          <button
            onClick={handlePay}
            disabled={acting}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-white font-medium
                       hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {acting ? "处理中..." : "立即支付"}
          </button>
        )}
        {order.canCancel && (
          <button
            onClick={handleCancel}
            disabled={acting}
            className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-600
                       hover:bg-zinc-50 disabled:opacity-50 transition-colors
                       dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
          >
            取消订单
          </button>
        )}
      </div>

      {/* 时间信息 */}
      <p className="mt-6 text-xs text-zinc-400">
        创建时间：{new Date(order.createdAt).toLocaleString("zh-CN")}
      </p>
    </div>
  );
}
