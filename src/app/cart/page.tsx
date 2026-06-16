// 购物车页面 —— Client Component
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  isActive: boolean;
  quantity: number;
}

interface CartData {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // 加载购物车数据
  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        router.push("/auth/login?redirect=/cart");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch {
      console.error("加载购物车失败");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 修改数量
  async function updateQuantity(itemId: number, quantity: number) {
    if (quantity < 1) return;
    setUpdatingId(itemId);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      } else {
        alert(data.message);
      }
    } catch {
      alert("网络错误");
    } finally {
      setUpdatingId(null);
    }
  }

  // 删除商品
  async function removeItem(itemId: number) {
    if (!confirm("确定要移除此商品吗？")) return;
    setUpdatingId(itemId);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch {
      alert("网络错误");
    } finally {
      setUpdatingId(null);
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">
        加载中...
      </div>
    );
  }

  // 空购物车
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-8xl mb-6">🛒</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          购物车是空的
        </h1>
        <p className="text-zinc-500 mb-6">快去挑选心仪的商品吧</p>
        <Link
          href="/"
          className="inline-flex rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          去逛逛
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
        购物车 ({cart.itemCount} 件)
      </h1>

      {/* 商品列表 */}
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* 商品图片 */}
            <Link
              href={`/products/${item.productId}`}
              className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">
                  📦
                </div>
              )}
            </Link>

            {/* 商品信息 */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link
                  href={`/products/${item.productId}`}
                  className="text-sm font-medium text-zinc-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-2"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
                  {formatPrice(item.price)}
                </p>
              </div>

              {/* 数量控制 + 操作 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={updatingId === item.id || item.quantity <= 1}
                    className="h-8 w-8 rounded-l-lg border border-zinc-300 text-zinc-600
                               hover:bg-zinc-50 disabled:opacity-30 transition-colors
                               dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    −
                  </button>
                  <span className="flex h-8 w-10 items-center justify-center border-y border-zinc-300 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {updatingId === item.id ? "..." : item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={updatingId === item.id || item.quantity >= item.stock}
                    className="h-8 w-8 rounded-r-lg border border-zinc-300 text-zinc-600
                               hover:bg-zinc-50 disabled:opacity-30 transition-colors
                               dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  disabled={updatingId === item.id}
                  className="text-xs text-zinc-400 hover:text-red-600 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部合计 + 结算按钮 */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-zinc-500">合计</span>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatPrice(cart.total)}
          </span>
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="w-full rounded-xl bg-blue-600 py-3 text-white font-medium
                     hover:bg-blue-700 transition-colors cursor-pointer"
        >
          去结算
        </button>
      </div>
    </div>
  );
}
