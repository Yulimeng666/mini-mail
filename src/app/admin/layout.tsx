// 后台管理布局 — Server Component 验证管理员权限 + Client Component 导航高亮
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
