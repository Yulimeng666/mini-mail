// 共享常量 — 状态标签、颜色映射等

/** 订单状态 → 显示标签 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "待付款",
  PAID: "已支付",
  SHIPPED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

/** 订单状态 → TailwindCSS 颜色类名 */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  PAID: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  COMPLETED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED:
    "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

/** 不可取消的订单状态（已支付之后需走退款流程） */
export const UNCANCELLABLE_STATUSES = ["PAID", "SHIPPED", "COMPLETED"];

/** 会员等级名称映射 */
export const MEMBERSHIP_LEVEL_NAMES: Record<number, string> = {
  1: "心悦一级",
  2: "心悦二级",
  3: "心悦三级",
};
