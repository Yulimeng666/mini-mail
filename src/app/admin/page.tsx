// 后台管理仪表盘 —— Server Component
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [productCount, orderCount, userCount, pendingOrders, totalRevenue] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
  ]);

  const stats = [
    { label: "商品总数", value: productCount, href: "/admin/products", color: "text-blue-600" },
    { label: "订单总数", value: orderCount, href: "/admin/orders", color: "text-purple-600" },
    { label: "待处理订单", value: pendingOrders, href: "/admin/orders?status=PENDING", color: "text-orange-600" },
    { label: "用户总数", value: userCount, href: "#", color: "text-green-600" },
    { label: "已支付营收", value: `¥${((totalRevenue._sum.total || 0)).toLocaleString("zh-CN")}`, href: "#", color: "text-red-600" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">仪表盘</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
