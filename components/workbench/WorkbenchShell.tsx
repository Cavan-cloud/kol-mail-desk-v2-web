"use client";

import { ChevronDown, Menu, PanelLeftClose, PanelRightClose, PanelRightOpen, PenLine } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AppBrand, AppSidebar } from "@/components/shell/AppNav";

export type SidebarStat = {
  label: string;
  value: number;
  href: string;
  icon: ReactNode;
  active?: boolean;
  /** 可选的鼠标悬浮 tooltip，原生 title。 */
  tooltip?: string;
};

type Props = {
  navBadges?: Record<string, number>;
  navFooter?: ReactNode;
  search?: ReactNode;
  headerActions?: ReactNode;
  /** 全局统计：放在侧栏底部，支持收起态。 */
  sidebarStats?: SidebarStat[];
  /** 左侧列表区域（KOL / 邮件列表）。 */
  listPane: ReactNode;
  /** 邮件详情顶部 sticky 区域。 */
  detailHeader?: ReactNode;
  /** 邮件正文 / 时间线滚动区域。 */
  detailBody: ReactNode;
  /** 邮件撰写底部 dock。 */
  composeDock?: ReactNode;
  /** 右侧信息抽屉（AI 建议 / 事实 / 分配）。 */
  infoPane?: ReactNode;
  /** 顶栏下方提示（Gmail 授权 / 历史同步引导等）。 */
  alerts?: ReactNode;
};

const SIDEBAR_KEY = "lmd.sidebar.collapsed";
const INFO_KEY = "lmd.info.open";
const COMPOSE_KEY = "lmd.compose.open";

export function WorkbenchShell({
  navBadges,
  navFooter,
  search,
  headerActions,
  sidebarStats,
  listPane,
  detailHeader,
  detailBody,
  composeDock,
  infoPane,
  alerts
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [composeOpen, setComposeOpen] = useState(true);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
    const storedInfo = window.localStorage.getItem(INFO_KEY);
    if (storedInfo !== null) setInfoOpen(storedInfo === "1");
    const storedCompose = window.localStorage.getItem(COMPOSE_KEY);
    if (storedCompose !== null) setComposeOpen(storedCompose === "1");
  }, []);

  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  function toggleInfo() {
    setInfoOpen((value) => {
      const next = !value;
      window.localStorage.setItem(INFO_KEY, next ? "1" : "0");
      return next;
    });
  }

  function toggleCompose() {
    setComposeOpen((value) => {
      const next = !value;
      window.localStorage.setItem(COMPOSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const statsFooter =
    sidebarStats && sidebarStats.length ? (
      <div className="grid gap-1">
        {sidebarStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            title={stat.tooltip ?? `${stat.label} · ${stat.value}`}
            aria-current={stat.active ? "true" : undefined}
            className={`focus-ring flex items-center rounded-xl border text-sm transition-colors duration-200 ${
              collapsed ? "h-9 flex-col justify-center gap-0 px-0" : "h-9 gap-2 px-2.5"
            } ${
              stat.active
                ? "border-lovart/30 bg-lovart-soft text-[#9a5a00] shadow-inset"
                : "border-transparent text-muted hover:bg-white/70 hover:text-ink"
            }`}
          >
            <span className="grid size-4 shrink-0 place-items-center">{stat.icon}</span>
            {collapsed ? (
              <span className="text-[10px] font-bold leading-none tabular-nums text-ink">{stat.value}</span>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{stat.label}</span>
                <strong className="font-mono text-sm tabular-nums text-ink">{stat.value}</strong>
              </>
            )}
          </Link>
        ))}
      </div>
    ) : null;

  const composedFooter =
    statsFooter || navFooter ? (
      <div className="flex w-full flex-col gap-2 border-t border-white/55 pt-2">
        {statsFooter}
        {navFooter}
      </div>
    ) : undefined;

  return (
    <div className="flex h-[100dvh] w-full flex-col gap-2.5 overflow-hidden p-2.5 text-ink lg:gap-3 lg:p-3">
      <header className="glass-shell flex h-12 shrink-0 items-center gap-3 rounded-2xl px-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white/70 hover:text-ink"
        >
          {collapsed ? <Menu className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <AppBrand />
        </div>
        <div className="min-w-0 flex-1">{search}</div>
        <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
        {infoPane ? (
          <button
            type="button"
            onClick={toggleInfo}
            aria-label={infoOpen ? "收起信息面板" : "展开信息面板"}
            aria-pressed={infoOpen}
            className={`focus-ring grid size-9 shrink-0 place-items-center rounded-full transition hover:bg-white/70 ${
              infoOpen ? "text-accent" : "text-muted hover:text-ink"
            }`}
          >
            {infoOpen ? <PanelRightClose className="size-5" /> : <PanelRightOpen className="size-5" />}
          </button>
        ) : null}
      </header>

      {alerts ? <div className="shrink-0 space-y-2">{alerts}</div> : null}

      <div className="flex min-h-0 flex-1 gap-2.5 lg:gap-3">
        <AppSidebar collapsed={collapsed} activeHref="/" badges={navBadges} footer={composedFooter} />

        <section
          aria-label="达人列表"
          className="glass-card flex w-[clamp(300px,26vw,360px)] shrink-0 flex-col overflow-hidden"
        >
          <div className="desk-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{listPane}</div>
        </section>

        <section aria-label="邮件详情" className="glass-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {detailHeader ? (
            <div className="shrink-0 border-b border-white/60 bg-white/40 px-5 py-3 backdrop-blur">{detailHeader}</div>
          ) : null}
          <div className="desk-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">{detailBody}</div>
          {composeDock ? (
            <div className="relative shrink-0 border-t-2 border-[#b8ddd3]/90 bg-gradient-to-b from-[#dff1ec] via-[#edf8f5]/95 to-white/55 shadow-[0_-6px_20px_rgba(46,125,110,0.08)] backdrop-blur">
              <button
                type="button"
                onClick={toggleCompose}
                aria-expanded={composeOpen}
                className="focus-ring flex w-full items-center gap-2 border-b border-[#c5e8df]/60 bg-gradient-to-r from-[#d4eee7]/50 via-[#e7f6f2]/30 to-[#d4eee7]/50 px-5 py-3 text-sm font-semibold text-[#1a5c52] transition hover:from-[#c8e9df]/70 hover:via-[#dff1ec]/50 hover:to-[#c8e9df]/70"
              >
                <PenLine className="size-4 text-[#2a7a6d]" />
                撰写回复
                <ChevronDown
                  className={`ml-auto size-4 text-[#2a7a6d]/70 transition-transform duration-300 ease-fluid ${composeOpen ? "" : "-rotate-90"}`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-fluid ${
                  composeOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="desk-scroll max-h-[60vh] overflow-y-auto border-t border-white/50 px-5 py-4">
                    {composeDock}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {infoPane ? (
          <aside
            aria-label="信息面板"
            className={`shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-fluid ${
              infoOpen ? "w-[320px] opacity-100" : "w-0 opacity-0"
            }`}
          >
            <div className="glass-card desk-scroll h-full w-[320px] overflow-y-auto overflow-x-hidden px-4 py-4">
              {infoPane}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
