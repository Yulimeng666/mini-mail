// 内存速率限制器 — 基于 IP 的简单频率控制
// 适用于微型项目，生产环境建议改用 Redis 或外部服务

interface RateRecord {
  count: number;
  resetAt: number; // 窗口重置时间戳 (ms)
}

const store = new Map<string, RateRecord>();

/** 定期清理过期记录（每 5 分钟） */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, record] of store) {
    if (now > record.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitOptions {
  /** 时间窗口（秒），默认 60 */
  windowSeconds?: number;
  /** 窗口内最大请求数，默认 5 */
  maxRequests?: number;
  /** 标识（用于日志） */
  label?: string;
}

interface RateLimitResult {
  success: boolean;
  message?: string;
  remaining: number;
}

/** 检查请求是否超过频率限制 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { windowSeconds = 60, maxRequests = 5, label = "请求" } = options;

  cleanup();

  const now = Date.now();
  const record = store.get(key);

  // 没有记录或窗口已过期 → 新建
  if (!record || now > record.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { success: true, remaining: maxRequests - 1 };
  }

  // 窗口内计数加 1
  record.count++;

  if (record.count > maxRequests) {
    const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      success: false,
      message: `${label}过于频繁，请 ${waitSeconds} 秒后再试`,
      remaining: 0,
    };
  }

  return { success: true, remaining: maxRequests - record.count };
}

/** 获取客户端 IP（支持代理） */
export function getClientIP(request: Request): string {
  // 尝试从常见代理 header 获取真实 IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // fallback: 直接连接 IP（本地开发时为 ::1 或 127.0.0.1）
  return request.headers.get("x-real-ip") || "unknown";
}
