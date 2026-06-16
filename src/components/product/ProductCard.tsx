// 商品卡片组件 —— Server Component
import Image from "next/image";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string | null;
  category: { name: string };
  className?: string;
}

export function ProductCard({ id, name, price, image, category, className }: ProductCardProps) {
  return (
    <Link
      href={`/products/${id}`}
      className={cn(
        "group block rounded-xl border border-zinc-200 bg-white overflow-hidden",
        "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        "dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* 商品图片 */}
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-300 dark:text-zinc-600">
            📦
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        {/* 分类标签 */}
        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
          {category.name}
        </span>
        {/* 商品名称 */}
        <h3 className="mt-2 font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
          {name}
        </h3>
        {/* 价格 */}
        <p className="mt-2 text-lg font-bold text-red-600 dark:text-red-400">
          {formatPrice(price)}
        </p>
      </div>
    </Link>
  );
}
