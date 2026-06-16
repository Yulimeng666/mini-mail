// 商品详情页 —— Server Component
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  // 查询商品详情（含分类信息）
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!product) {
    notFound();
  }

  // 库存状态显示
  const stockStatus =
    product.stock > 10
      ? { text: "有货", color: "text-green-600 bg-green-50 dark:bg-green-900/30" }
      : product.stock > 0
        ? { text: `仅剩 ${product.stock} 件`, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/30" }
        : { text: "已售罄", color: "text-red-600 bg-red-50 dark:bg-red-900/30" };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* 面包屑导航 */}
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-blue-600 transition-colors">首页</Link>
        <span className="mx-2">/</span>
        <Link
          href={`/?category=${product.category.slug}`}
          className="hover:text-blue-600 transition-colors"
        >
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900 dark:text-zinc-100">{product.name}</span>
      </nav>

      {/* 商品详情区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧：商品图片 */}
        <div className="relative aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-zinc-300 dark:text-zinc-600">
              <div>
                <span className="text-8xl">📦</span>
                <p className="mt-2 text-sm">暂无图片</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：商品信息 */}
        <div className="flex flex-col">
          {/* 分类标签 */}
          <Link
            href={`/?category=${product.category.slug}`}
            className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full self-start mb-3 hover:underline"
          >
            {product.category.name}
          </Link>

          {/* 商品名称 */}
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            {product.name}
          </h1>

          {/* 价格 */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* 库存状态 */}
          <span className={`text-xs px-2 py-0.5 rounded-full self-start mb-6 ${stockStatus.color}`}>
            {stockStatus.text}
          </span>

          {/* 商品描述 */}
          {product.description && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-zinc-500 mb-2">商品描述</h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-auto flex gap-3">
            <AddToCartButton productId={product.id} stock={product.stock} />
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-600
                         hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-400"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
