// 心悦会员体系 — 折扣计算 + 等级判断

/** 会员等级配置 */
const MEMBERSHIP_CONFIG = [
  { level: 0, name: "普通会员", threshold: 0, discountRate: 1 },      // 无折扣
  { level: 1, name: "心悦一级", threshold: 8_000, discountRate: 0.98 },  // 9.8 折
  { level: 2, name: "心悦二级", threshold: 80_000, discountRate: 0.95 }, // 9.5 折
  { level: 3, name: "心悦三级", threshold: 800_000, discountRate: 0.9 }, // 9 折
];

/** 根据累计消费金额计算会员等级（只升不降） */
export function calcMembershipLevel(totalSpent: number, currentLevel: number): number {
  let newLevel = currentLevel;

  for (const config of MEMBERSHIP_CONFIG) {
    if (totalSpent >= config.threshold && config.level > newLevel) {
      newLevel = config.level;
    }
  }

  return newLevel;
}

/** 获取会员折扣率 */
export function getDiscountRate(level: number): number {
  const config = MEMBERSHIP_CONFIG.find((c) => c.level === level);
  return config?.discountRate ?? 1;
}

/** 获取会员等级名称 */
export function getLevelName(level: number): string {
  const config = MEMBERSHIP_CONFIG.find((c) => c.level === level);
  return config?.name ?? "普通会员";
}

/** 计算折扣金额 */
export function calcDiscount(originalTotal: number, level: number): number {
  const rate = getDiscountRate(level);
  return Math.round((originalTotal * (1 - rate)) * 100) / 100;
}

/** 计算折后实付金额 */
export function calcFinalTotal(originalTotal: number, level: number): number {
  const discount = calcDiscount(originalTotal, level);
  return Math.round((originalTotal - discount) * 100) / 100;
}

/** 会员等级对应的展示标签 */
export function getLevelBadge(level: number): { text: string; color: string } | null {
  if (level === 0) return null;

  const colors: Record<number, string> = {
    1: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    2: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    3: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return {
    text: getLevelName(level),
    color: colors[level] || "",
  };
}
