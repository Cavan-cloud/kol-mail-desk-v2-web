# kol-mail-desk-v2-web

[![web-ci](https://github.com/Cavan-cloud/kol-mail-desk-v2-web/actions/workflows/web-ci.yml/badge.svg)](https://github.com/Cavan-cloud/kol-mail-desk-v2-web/actions/workflows/web-ci.yml)

Next.js 15 frontend for kol-mail-desk v2. 所有业务数据经 Spring 后端 `lib/api-client/` 获取。

**Status: Phase 1 — 只读核心 API + 前端壳（18/18 完成）**

规格：`../kol-mail-desk-v2-docs/specs/` · 旧仓库只读参考：`../kol-mail-desk`

## 本地启动

```bash
cp .env.local.example .env.local
pnpm install
pnpm dev
```

需同时启动后端（默认 `http://localhost:8080`）。详见 `../kol-mail-desk-v2-docs/specs/SETUP.md`。

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | Next.js 开发服（:3000） |
| `pnpm build` | 生产构建 |
| `pnpm lint` | ESLint（含 legacy import 禁则） |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test:run` | Vitest 单元测试 |
| `pnpm gen:api` | 从 OpenAPI 重生成 `types.gen.ts` |
| `pnpm test:e2e:smoke` | Playwright @smoke（mock 后端 API，无需 OAuth） |

## API 客户端

- 契约源：`../kol-mail-desk-v2-docs/specs/api-contract-v1.yaml`
- 用法：`import { apiClient } from "@/lib/api-client"`
- Query hooks：`lib/api-client/queries.ts`

## 路由

| 路径 | 页面 |
|------|------|
| `/` | 工作台 |
| `/board` | 团队看板 |
| `/team` | 团队成员 |
| `/templates` | 邮件模板 |
| `/scheduled` | 定时邮件 |
| `/login` | Google OAuth 登录 |
| `/onboarding` | 首次资料完善 |

## 架构约束（P1-T16）

禁止引入 legacy 模块：`lib/data` · `lib/gmail` · `lib/feishu` · `lib/supabase` · `app/api`。  
ESLint `no-restricted-imports` + `lib/__tests__/forbidden-legacy.test.ts` 双重守护。
