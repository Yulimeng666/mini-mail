
<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h1>📦 Mini Mail</h1>
  <p>
    基于 Next.js 16 的微型全栈电商项目
    <br /><br />
    <a href="#-功能一览"><strong>功能一览</strong></a>
    ·
    <a href="#-快速开始"><strong>快速开始</strong></a>
    ·
    <a href="#-技术栈"><strong>技术栈</strong></a>
    ·
    <a href="#-项目结构"><strong>项目结构</strong></a>
  </p>
</div>

---

## 📖 项目概述

Mini Mail 是一个学习型全栈电商项目，覆盖从商品浏览、用户认证、购物车、下单支付到后台管理的完整业务流程。内置心悦会员等级体系，下单自动折扣，消费自动升级。

| 前台 | 后台 |
|------|------|
| 商品浏览 / 搜索 / 分类筛选 | 仪表盘数据统计 |
| 用户注册 / 登录 / Session 管理 | 商品 CRUD（含上下架） |
| 购物车（RESTful API + 库存校验） | 订单状态流转 |
| 下单 + 会员折扣自动计算 | 分类管理 |
| 模拟支付 + 自动升级会员等级 | 管理员权限控制 |
| 订单列表 / 详情 | — |

---

## 🎯 功能一览

### 🛒 商品模块
- 首页商品网格 + 分页
- 关键词搜索（防抖）
- 分类标签切换
- 商品详情（图片 / 价格 / 库存状态）

### 👤 用户系统
- 邮箱注册 / 登录
- bcryptjs 密码哈希存储
- httpOnly Cookie Session（iron-session）
- 防撞库攻击（统一错误提示）
- 登录频率限制（5 次 / 分钟）

### 🛍️ 购物车
- RESTful API（GET / POST / PUT / DELETE）
- 同商品自动合并数量
- 库存实时校验
- 小计 + 总价计算

### 📋 订单 & 支付
- 数据库事务创建订单（建单 + 扣库存 + 清购物车）
- 会员折扣自动计算
- 模拟支付 → 累加消费金额
- 自动升级心悦等级（只升不降）
- 取消订单自动恢复库存

### 💎 心悦会员体系

| 等级 | 累计消费 | 折扣率 |
|:---:|:---:|:---:|
| 🥉 心悦一级 | ¥8,000 | 9.8 折 |
| 🥈 心悦二级 | ¥80,000 | 9.5 折 |
| 🥇 心悦三级 | ¥800,000 | 9.0 折 |

### 🛡️ 安全性
- 全端点认证覆盖（24 个 API）
- 三层防护：proxy.ts → API Handler → 数据库事务
- 原子累加消费金额（防并发覆盖）
- 事务内库存二次校验（防 TOCTOU 竞态）
- 购物车 / 订单归属校验

### 🔧 后台管理
- 仪表盘（商品 / 订单 / 用户 / 营收统计）
- 商品管理：表格 + 搜索筛选 + 弹窗表单
- 订单管理：状态筛选 + 一键流转
- 分类管理：新增 + 删除保护

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 22 LTS
- **npm** ≥ 10

### 安装

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd mini-mail

# 2. 安装依赖
npm install

# 3. 初始化数据库
npx prisma db push

# 4. 填充种子数据
npx prisma db seed
```

### 运行

```bash
# 开发模式（Turbopack）
npm run dev
# → http://localhost:3000

# 生产构建
npm run build
npm start
```

### 种子账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | `admin@minimail.com` | `admin123` |
| 普通用户 | `user@minimail.com` | `user123` |

---

## 🧰 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | 22 LTS |
| 全栈框架 | Next.js (App Router) | 16.2 |
| UI 库 | React (Server Components) | 19.2 |
| 类型系统 | TypeScript | ^5 |
| ORM | Prisma | 5.22 |
| 数据库 | SQLite | 文件数据库 |
| CSS 框架 | Tailwind CSS | ^4 |
| 认证 | iron-session | 8.0 |
| 密码加密 | bcryptjs | 3.0 |
| 工具库 | clsx + tailwind-merge | — |

---

## 📁 项目结构

```
mini-mail/
├── prisma/
│   ├── schema.prisma          # 6 张表数据模型
│   └── seed.ts                # 种子数据（14 商品 / 5 分类 / 2 用户）
├── src/
│   ├── app/
│   │   ├── page.tsx           # 首页（商品网格 + 搜索 + 分类）
│   │   ├── layout.tsx         # 根布局（Navbar + Footer）
│   │   ├── globals.css        # Tailwind CSS v4 入口
│   │   ├── products/          # 商品详情
│   │   ├── cart/              # 购物车页面
│   │   ├── orders/            # 订单列表 + 详情
│   │   ├── auth/              # 登录 / 注册
│   │   ├── admin/             # 后台管理面板
│   │   └── api/               # 24 个 API 端点
│   │       ├── products/      # 商品 API（公开）
│   │       ├── categories/    # 分类 API（公开）
│   │       ├── auth/          # 认证 API
│   │       ├── cart/          # 购物车 API
│   │       ├── orders/        # 订单 API
│   │       └── admin/         # 管理后台 API
│   ├── components/
│   │   ├── layout/            # Navbar / UserMenu
│   │   ├── product/           # ProductCard / SearchBar / CategoryTabs / Pagination
│   │   ├── cart/              # AddToCartButton
│   │   ├── auth/              # LoginForm / RegisterForm
│   │   └── admin/             # AdminSidebar
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 单例
│   │   ├── auth.ts            # 密码哈希 / Session 管理
│   │   ├── session.ts         # iron-session 配置
│   │   ├── membership.ts      # 会员折扣 / 等级计算
│   │   ├── cart.ts            # 购物车共享函数
│   │   ├── constants.ts       # 状态标签 / 颜色常量
│   │   ├── admin-auth.ts      # 管理员鉴权
│   │   ├── rate-limit.ts      # 内存频率限制
│   │   ├── queries.ts         # 共享查询函数
│   │   └── utils.ts           # cn() / formatPrice()
│   └── proxy.ts               # 路由权限拦截（Next.js 16 middleware）
├── package.json
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

---

## 🗄️ 数据模型

```prisma
User        — id, email, password, name, role, totalSpent, membershipLevel
Category    — id, name, slug
Product     — id, name, description, price, image, stock, isActive, categoryId
Cart        — id, userId  (1:1 User)
CartItem    — id, cartId, productId, quantity
Order       — id, userId, status, originalTotal, discount, total
OrderItem   — id, orderId, productId, quantity, price（下单快照）
```

---

## 🔐 路由权限

| 路由 | 权限 | 实现 |
|------|------|------|
| `/` `/products/*` | 公开 | — |
| `/auth/login` `/auth/register` | 已登录 → 重定向首页 | Server Component |
| `/cart` `/orders/*` | 需登录 | proxy.ts + API 二次校验 |
| `/admin/*` `/api/admin/*` | 需管理员 (role=ADMIN) | proxy.ts + checkAdmin() + layout.tsx |

---

## 📦 部署

### Vercel

1. Fork 本项目
2. 在 Vercel 中导入仓库
3. 设置环境变量：
   ```bash
   SESSION_SECRET=<随机 32 位以上字符串>
   ```
4. 部署

> **注意**：Vercel Serverless 环境不支持 SQLite 持久化。生产环境请改用 PostgreSQL——Prisma 只需修改 `datasource` 和 `DATABASE_URL`。

### 自托管

```bash
npm run build
npm start
```

生产环境务必设置：
```bash
export NODE_ENV=production
export SESSION_SECRET=<随机 32 位以上字符串>
```

---

## 🧪 常用命令

```bash
npm run dev           # 启动开发服务器
npm run build         # 生产构建
npx prisma studio     # 数据库管理界面
npx prisma db push    # 同步 Schema 到数据库
npx prisma generate   # 重新生成 Prisma Client
npx prisma db seed    # 运行种子脚本
```

---

## 📄 许可证

MIT License
