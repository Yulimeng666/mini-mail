# Mini Mail 微型电商 — 项目方案设计

> 一个基于 Next.js 16 全栈框架的微型电商项目，支持商品浏览、用户注册登录、购物车、下单、模拟支付和后台管理。

---

## 一、技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Node.js | **22 LTS** (≥20.9) | Next.js 16.2+ 最低要求 |
| 全栈框架 | Next.js | **16.2.7** | App Router + Turbopack |
| UI 库 | React | **19.2.3** | Server Components 稳定 |
| 类型系统 | TypeScript | **5.7.x** | |
| ORM | Prisma | **5.22.0** | 最新 5.x 版本，SQLite 原生支持 |
| 数据库 | SQLite | — | 文件数据库，零安装零配置 |
| CSS 框架 | Tailwind CSS | **4.2.x** | CSS-first 配置 |
| 认证 | next-auth (v5) | **5.x** | 或 iron-session 轻量方案 |
| 校验 | Zod + React Hook Form | — | 前后端统一校验 |
| 工具 | clsx + tailwind-merge | — | 样式类名合并 |

### 兼容性说明

- **Tailwind CSS v4** 搭配 Next.js 16 需要使用 `@tailwindcss/postcss` 包，不再需要 `tailwind.config.ts`
- `postcss.config.mjs` 必须使用**对象语法**（非数组），否则 Turbopack 无法正确处理
- Prisma 5.x + SQLite 完全开箱即用，`DATABASE_URL="file:./dev.db"` 即可

---

## 二、GitHub 参考项目

| 项目 | Stars | 技术栈 | 参考价值 |
|------|-------|--------|----------|
| [next16-boilerplate](https://github.com/azkacrows/next16-boilerplate) | — | Next.js 16 + TS + Tailwind CSS 4 | 项目初始化脚手架 |
| [mini-commerce](https://github.com/tgbypc/mini-commerce) | ★ | Next.js 15 + React 19 + Tailwind v4 + Firebase | 电商功能设计（产品/购物车/Stripe 支付/管理后台） |
| [Mini-E-commerce](https://github.com/laxman939/Mini-E-commerce) | ★ | Next.js + Redux Toolkit + Tailwind CSS | 前端交互参考（搜索/筛选/购物车/心愿单） |
| [waynboot-mall](https://github.com/wayn111/waynboot-mall) | 1.2k | Spring Boot 3 + Vue 3 | 功能模块设计参考（虽技术栈不同，业务逻辑可借鉴） |

---

## 三、功能模块

### 前台（所有用户可访问）

#### 1. 商品浏览
- **商品列表页** `/products`：分页展示、分类侧边栏筛选、关键词搜索
- **商品详情页** `/products/[id]`：图片、名称、描述、价格、库存、加入购物车按钮

#### 2. 用户系统
- **注册** `/auth/register`：邮箱 + 密码 + 姓名，密码 bcrypt 加密存储
- **登录** `/auth/login`：邮箱 + 密码验证
- **Session 管理**：基于 Cookie 的 Session 认证
- **路由保护**：middleware.ts 对需登录页面进行拦截重定向

#### 3. 购物车（需登录）
- **购物车页** `/cart`：查看已添加商品、修改数量、删除商品
- 购物车数据持久化到数据库（与用户绑定）

#### 4. 下单 & 订单管理（需登录）
- **结算页** `/checkout`：确认商品清单、数量、原始总价、会员折扣、实付金额
- **会员折扣**：根据用户心悦等级自动计算折扣（一级 9.8 折 / 二级 9.5 折 / 三级 9 折）
- **模拟支付**：点击"确认支付" → 订单状态从 `PENDING` → `PAID`，实付金额累加到用户 `totalSpent`
- **自动升级**：支付后 `totalSpent` 达到下一级门槛时自动升级 `membershipLevel`
- **我的订单** `/orders`：订单列表、状态标签
- **订单详情** `/orders/[id]`：商品清单、原价/折扣/实付明细、状态时间线

### 后台管理（仅管理员）

#### 5. 后台管理 `/admin`
- **仪表盘**：订单总数、商品总数、用户数统计卡片
- **商品管理** `/admin/products`：列表 + 新增 + 编辑 + 删除 + 上架/下架
- **分类管理** `/admin/categories`：新增 + 编辑 + 删除分类
- **订单管理** `/admin/orders`：查看所有订单、状态流转（PAID → SHIPPED → COMPLETED → CANCELLED）

---

## 四、数据模型（Prisma Schema）

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             Int       @id @default(autoincrement())
  email          String    @unique
  password       String                 // bcrypt 哈希
  name           String
  role           String    @default("USER")  // USER | ADMIN
  totalSpent     Float     @default(0)       // 累计消费金额（用于升级心悦会员）
  membershipLevel Int     @default(0)       // 心悦等级：0=普通 1=一级 2=二级 3=三级
  createdAt      DateTime  @default(now())
  orders         Order[]
  cart           Cart?
}

model Category {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  slug     String    @unique
  products Product[]
}

model Product {
  id          Int          @id @default(autoincrement())
  name        String
  description String
  price       Float
  image       String?               // 图片路径（本地 /uploads/）
  stock       Int          @default(0)
  isActive    Boolean      @default(true)
  categoryId  Int
  category    Category     @relation(fields: [categoryId], references: [id])
  createdAt   DateTime     @default(now())
  cartItems   CartItem[]
  orderItems  OrderItem[]
}

model Cart {
  id     Int        @id @default(autoincrement())
  userId Int        @unique
  user   User       @relation(fields: [userId], references: [id])
  items  CartItem[]
}

model CartItem {
  id        Int     @id @default(autoincrement())
  cartId    Int
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId Int
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int     @default(1)
}

model Order {
  id            Int         @id @default(autoincrement())
  userId        Int
  user          User        @relation(fields: [userId], references: [id])
  status        String      @default("PENDING")  // PENDING | PAID | SHIPPED | COMPLETED | CANCELLED
  originalTotal Float                          // 折扣前原始总价
  discount      Float       @default(0)        // 折扣金额
  total         Float                          // 折扣后实付总价
  items         OrderItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model OrderItem {
  id        Int     @id @default(autoincrement())
  orderId   Int
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId Int
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Float            // 下单时的价格快照（商品价格后续变动不影响历史订单）
}
```

### 表关系图

```
User (1) ──< (N) Order ──< (N) OrderItem >── (1) Product
User (1) ──< (1) Cart ──< (N) CartItem >── (1) Product
Category (1) ──< (N) Product
```

### 心悦会员体系

用户累计消费达到相应金额后自动升级，后续下单享受对应折扣：

| 等级 | 名称 | 累计消费门槛 | 折扣 | 折扣率 |
|------|------|-------------|------|--------|
| 0 | 普通用户 | — | 无折扣 | 100% |
| 1 | 心悦一级 | ¥8,000 | 9.8 折 | 98% |
| 2 | 心悦二级 | ¥80,000 | 9.5 折 | 95% |
| 3 | 心悦三级 | ¥800,000 | 9 折 | 90% |

**升级规则**：
- 用户 `totalSpent` 达到对应门槛时，`membershipLevel` 自动升级
- 下单时根据当前 `membershipLevel` 计算折扣：`discount = originalTotal * (1 - discountRate)`
- `total = originalTotal - discount`
- 支付完成后将 `total` 累加到 `totalSpent`，触发等级重新计算

**下单折扣计算示例**：
```
心悦一级用户下单 ¥10,000 →
  originalTotal = 10000
  discount = 10000 * 0.02 = 200
  total = 10000 - 200 = 9800
  支付后 totalSpent += 9800（以实付金额累计）
```

---

## 五、目录结构

```
mini-mail/
├── prisma/
│   ├── schema.prisma           # 数据模型
│   └── seed.ts                 # 种子数据（分类、示例商品、管理员账号）
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind CSS v4 入口 (@import "tailwindcss")
│   │   ├── layout.tsx          # 根布局（Navbar + Footer）
│   │   ├── page.tsx            # 首页（商品推荐、分类入口）
│   │   ├── (shop)/             # 商城前台路由组
│   │   │   ├── layout.tsx      # 前台共享布局
│   │   │   ├── products/
│   │   │   │   ├── page.tsx          # 商品列表（搜索 + 分页 + 分类筛选）
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # 商品详情
│   │   │   ├── cart/
│   │   │   │   └── page.tsx          # 购物车
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx          # 我的订单
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # 订单详情
│   │   │   └── checkout/
│   │   │       └── page.tsx          # 结算下单
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # 登录
│   │   │   └── register/page.tsx     # 注册
│   │   └── admin/                    # 后台管理
│   │       ├── layout.tsx            # 后台布局（侧边栏导航）
│   │       ├── page.tsx              # 仪表盘
│   │       ├── products/
│   │       │   ├── page.tsx          # 商品管理列表
│   │       │   ├── new/page.tsx      # 新增商品
│   │       │   └── [id]/edit/page.tsx # 编辑商品
│   │       ├── orders/
│   │       │   ├── page.tsx          # 订单管理
│   │       │   └── [id]/page.tsx     # 订单详情（状态流转）
│   │       └── categories/
│   │           └── page.tsx          # 分类管理
│   ├── components/
│   │   ├── ui/                       # 通用 UI（Button/Card/Input/Modal/Pagination 等）
│   │   ├── layout/                   # Navbar / Footer / AdminSidebar
│   │   ├── product/                  # ProductCard / ProductGrid / SearchBar / CategoryFilter
│   │   ├── cart/                     # CartItem / CartSummary
│   │   └── admin/                    # DataTable / ProductForm / CategoryForm / StatsCard
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma 客户端单例
│   │   ├── auth.ts                   # 认证工具（登录/注册/获取当前用户）
│   │   ├── session.ts               # Session 配置（iron-session 或 next-auth）
│   │   └── utils.ts                  # cn() 样式合并等工具函数
│   ├── middleware.ts                 # 路由权限拦截
│   └── types/
│       └── index.ts                  # 共享 TypeScript 类型定义
├── public/
│   └── uploads/                      # 商品图片（本地存储）
├── .env                              # 环境变量
├── .env.example
├── next.config.ts
├── postcss.config.mjs                # Tailwind CSS v4 PostCSS 配置
├── tsconfig.json
└── package.json
```

---

## 六、路由权限设计

| 路由 | 权限 | 说明 |
|------|------|------|
| `/` | 公开 | 首页 |
| `/products` | 公开 | 商品列表 |
| `/products/[id]` | 公开 | 商品详情 |
| `/auth/login` | 公开（未登录） | 登录页 |
| `/auth/register` | 公开（未登录） | 注册页 |
| `/cart` | 需登录 | 购物车 |
| `/checkout` | 需登录 | 结算下单 |
| `/orders` | 需登录 | 我的订单 |
| `/orders/[id]` | 需登录（本人或管理员） | 订单详情 |
| `/admin` | 需管理员 | 仪表盘 |
| `/admin/*` | 需管理员 | 所有后台页面 |

> 通过 `src/middleware.ts` 统一拦截，未登录重定向到 `/auth/login`，无权限重定向到 403。

---

## 七、订单 & 会员流程

### 订单状态流转

```
PENDING ──[模拟支付]──→ PAID ──[管理员发货]──→ SHIPPED ──[确认收货]──→ COMPLETED
   │                                                       
   └──────[取消订单]──────→ CANCELLED
```

### 支付后会员升级流程

```
支付完成(total) → totalSpent += total
                      │
                      ├─ totalSpent ≥ 800,000 → membershipLevel = 3（心悦三级，9折）
                      ├─ totalSpent ≥ 80,000  → membershipLevel = 2（心悦二级，9.5折）
                      ├─ totalSpent ≥ 8,000   → membershipLevel = 1（心悦一级，9.8折）
                      └─ totalSpent < 8,000   → membershipLevel = 0（普通用户）
```

---

## 八、实施计划

### 阶段 1：项目初始化
1. `npx create-next-app@latest mini-mail --typescript --tailwind --eslint --app --src-dir`
2. 安装依赖：
   ```bash
   npm install prisma@5 @prisma/client@5
   npm install next-auth@5 bcryptjs zod react-hook-form clsx tailwind-merge
   npm install -D @tailwindcss/postcss
   ```
3. 配置 Tailwind CSS v4（`postcss.config.mjs` 对象语法）
4. 初始化 Prisma：`npx prisma init --datasource-provider sqlite`
5. 编写 `schema.prisma` → `npx prisma db push`
6. 编写种子脚本 `prisma/seed.ts`，插入分类 + 示例商品 + 管理员账号

### 阶段 2：认证系统
7. 创建 Prisma 单例 `src/lib/prisma.ts`
8. 配置 Session（iron-session 方案）`src/lib/session.ts`
9. 实现注册/登录 API + 页面
10. 编写 `middleware.ts` 路由权限拦截

### 阶段 3：商品模块
11. 商品列表页：分页查询 + 分类筛选 + 关键词搜索
12. 商品详情页：展示信息 + 加入购物车
13. 首页：推荐商品展示、分类导航入口

### 阶段 4：购物车 & 下单
14. 购物车页面：列表 + 修改数量 + 删除 + 总价计算
15. 结算页：确认订单 + 显示会员折扣 + 模拟支付（更新订单状态 + 累加 totalSpent + 自动升级会员等级）
16. 我的订单列表 + 订单详情（含折扣明细）

### 阶段 5：后台管理
17. 后台布局（侧边栏导航 + 面包屑）
18. 仪表盘（统计数据卡片）
19. 商品 CRUD（新增/编辑/删除/上架下架）
20. 分类管理（新增/编辑/删除）
21. 订单管理（列表 + 状态流转操作按钮）

### 阶段 6：收尾
22. 全局样式打磨、响应式适配
23. 最终验证完整购物流程

---

## 九、验证清单

- [ ] 未登录用户可浏览首页、商品列表、商品详情
- [ ] 用户可注册新账号并登录
- [ ] 登录后可正常加购、修改数量、删除购物车商品
- [ ] 购物车商品总价计算正确
- [ ] 下单 → 结算页显示会员等级折扣（原价/折扣金额/实付金额）
- [ ] 模拟支付 → 订单状态变为 PAID，totalSpent 正确累加
- [ ] 累计消费 ¥8,000 → 自动升级心悦一级，后续订单享 9.8 折
- [ ] 累计消费 ¥80,000 → 自动升级心悦二级，后续订单享 9.5 折
- [ ] 累计消费 ¥800,000 → 自动升级心悦三级，后续订单享 9 折
- [ ] 我的订单列表正确显示所有订单及状态
- [ ] 未登录访问 `/cart` 自动跳转 `/auth/login`
- [ ] 普通用户访问 `/admin` 显示 403 或跳转首页
- [ ] 管理员可对商品进行增删改查
- [ ] 管理员可管理分类
- [ ] 管理员可流转订单状态（PAID → SHIPPED → COMPLETED）
- [ ] 管理员可查看用户列表及会员等级
