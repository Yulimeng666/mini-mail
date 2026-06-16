# Mini Mail — 微型电商项目

## 项目概述

一个基于 Next.js 16 全栈框架的微型电商项目。支持商品浏览、用户注册登录、购物车、下单、模拟支付、心悦会员体系和后台管理。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | **22 LTS** |
| 全栈框架 | Next.js | **16.2.9** |
| UI 库 | React | **19.2.4** |
| 类型系统 | TypeScript | **^5** |
| ORM | Prisma | **5.22.0** |
| 数据库 | SQLite | 文件数据库 (`prisma/dev.db`) |
| CSS 框架 | Tailwind CSS | **^4** (CSS-first 配置) |
| 认证 | iron-session | Cookie-based Session |
| 密码加密 | bcryptjs | — |
| 表单校验 | React Hook Form + Zod | — |
| 样式工具 | clsx + tailwind-merge | `cn()` 函数 |

## 项目结构

```
mini-mail/
├── prisma/
│   ├── schema.prisma        # 数据模型
│   └── seed.ts              # 种子数据
├── src/
│   ├── app/
│   │   ├── globals.css      # Tailwind CSS v4 入口
│   │   ├── layout.tsx       # 根布局
│   │   ├── page.tsx         # 首页
│   │   ├── (shop)/          # 商城前台路由组
│   │   │   ├── products/    # 商品列表 + 详情
│   │   │   ├── cart/        # 购物车
│   │   │   ├── checkout/    # 结算下单
│   │   │   └── orders/      # 我的订单
│   │   ├── auth/            # 登录/注册
│   │   └── admin/           # 后台管理（需 ADMIN 角色）
│   ├── components/
│   │   ├── ui/              # 通用 UI 组件
│   │   ├── layout/          # Navbar / Footer / AdminSidebar
│   │   ├── product/         # 商品相关组件
│   │   ├── cart/            # 购物车组件
│   │   └── admin/           # 后台组件
│   ├── lib/
│   │   ├── prisma.ts        # Prisma 客户端单例
│   │   ├── auth.ts          # 认证工具
│   │   ├── session.ts       # iron-session 配置
│   │   ├── membership.ts    # 心悦会员折扣计算
│   │   └── utils.ts         # cn() 等工具函数
│   ├── proxy.ts             # 路由权限拦截（Next.js 16 替代 middleware）
│   └── types/
│       └── index.ts         # 共享类型定义
├── public/uploads/          # 商品图片
├── postcss.config.mjs       # Tailwind CSS v4 PostCSS 配置
└── package.json
```

## Next.js 16 关键注意事项

- **Middleware 已更名为 Proxy**：文件是 `proxy.ts`（不是 `middleware.ts`）
- **Tailwind CSS v4**：使用 `@tailwindcss/postcss`，CSS 入口 `@import "tailwindcss"`，无 `tailwind.config.ts`
- **postcss.config.mjs** 必须使用对象语法（非数组），否则 Turbopack 无法处理
- 如有 Turbopack + PostCSS 卡住问题，可在 `package.json` scripts 中加 `--webpack` 降级
- **Server Components 是默认**：文件默认在服务端渲染，需要客户端交互时加 `"use client"`

## 数据模型（6 张表）

- **User** — 用户，含 `totalSpent`（累计消费）和 `membershipLevel`（心悦等级）
- **Category** — 商品分类
- **Product** — 商品
- **Cart + CartItem** — 购物车（用户 1:1）
- **Order + OrderItem** — 订单，含 `originalTotal`、`discount`、`total`（会员折扣三字段）

## 心悦会员体系

| 等级 | 累计消费门槛 | 折扣 |
|------|-------------|------|
| 心悦一级 | ¥8,000 | 9.8 折 |
| 心悦二级 | ¥80,000 | 9.5 折 |
| 心悦三级 | ¥800,000 | 9 折 |

- 支付完成后 `totalSpent += total`，自动判断升级（只升不降）
- 下单时根据 `membershipLevel` 计算折扣

## 路由权限

| 路由 | 权限 |
|------|------|
| `/`, `/products`, `/products/[id]` | 公开 |
| `/auth/login`, `/auth/register` | 公开（未登录） |
| `/cart`, `/checkout`, `/orders/*` | 需登录 |
| `/admin/*` | 需管理员（role=ADMIN） |

通过 `src/proxy.ts` 统一拦截。

## 编码规范

- 使用 `@/*` 路径别名指向 `src/*`
- 样式合并使用 `cn()` 函数（clsx + tailwind-merge）
- 表单校验使用 Zod schema，前端用 React Hook Form
- 服务端数据查询直接在 Server Component 中调用 Prisma
- 数据变更使用 Server Actions（`"use server"`）
- 所有密码使用 bcryptjs 哈希存储
- 订单价格计算在服务端完成（防篡改）

## 命令

```bash
npm run dev          # 启动开发服务器
npx prisma studio    # 打开数据库管理界面
npx prisma db push   # 同步 schema 到数据库
npx prisma generate  # 重新生成 Prisma Client
npx prisma db seed   # 运行种子脚本
```

## 关键文件路径

- 数据模型: `prisma/schema.prisma`
- Prisma 单例: `src/lib/prisma.ts`
- 认证 Session: `src/lib/session.ts`
- 路由拦截: `src/proxy.ts`
- 会员折扣: `src/lib/membership.ts`
- 项目方案: `../Mini-Mail-方案设计.md`

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用
- **api-crud-generator**: 根据 Prisma 模型生成标准的 Next.js API Route + 前端管理页面。触发词：生成CRUD、生成接口、生成管理页面

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
