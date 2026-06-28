# kol-mail-desk-v2-web

[![web-ci](https://github.com/ORG/kol-mail-desk-v2-web/actions/workflows/web-ci.yml/badge.svg)](https://github.com/ORG/kol-mail-desk-v2-web/actions/workflows/web-ci.yml)

Next.js frontend for kol-mail-desk v2.

**Status: Phase 0 — directory skeleton only. No package.json yet.**

> CI badge URL 中的 `ORG` 为占位符，待 P0-T11 配置 GitHub 远端后替换为真实 org/user 名。
> Phase 0 期间 `web-ci.yml` 仅跑一个 `skeleton-guard` job（package.json 一旦在 P1-T12 引入即自动切换到 `pnpm test + build`，playwright.config.* 引入后自动启用 smoke）。

See `../kol-mail-desk-v2-docs/specs/` for architecture and phase plan.

Legacy repo (read-only reference): `../kol-mail-desk`
