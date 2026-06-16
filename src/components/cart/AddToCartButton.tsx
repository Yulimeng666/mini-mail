// 加入购物车按钮 —— Client Component
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: number;
  stock: number;
}

export function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleAddToCart() {
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();

      if (!data.success) {
        // 如果是未登录，跳转到登录页
        if (res.status === 401) {
          router.push(`/auth/login?redirect=/products/${productId}`);
          return;
        }
        alert(data.message);
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={stock === 0 || loading}
      className={`flex-1 rounded-xl py-3 text-white font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
        success
          ? "bg-green-600 hover:bg-green-700"
          : "bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500"
      }`}
    >
      {success ? "已加入购物车 ✓" : stock > 0 ? (loading ? "添加中..." : "加入购物车") : "暂时缺货"}
    </button>
  );
}
