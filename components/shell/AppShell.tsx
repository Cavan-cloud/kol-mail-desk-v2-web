"use client";

import { Menu, PanelLeftClose } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AppBrand, AppSidebar } from "@/components/shell/AppNav";

const SIDEBAR_KEY = "lmd.sidebar.collapsed";

export function AppShell({
  activeHref,
  title,
  headerActions,
  children
}: {
  activeHref: string;
  title?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
  }, []);

  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col gap-2.5 overflow-hidden p-2.5 text-ink lg:gap-3 lg:p-3">
      <header className="glass-shell flex h-14 shrink-0 items-center gap-3 rounded-2xl px-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white/70 hover:text-ink"
        >
          {collapsed ? <Menu className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
        <AppBrand />
        {title ? <span className="ml-1 truncate text-sm font-semibold text-ink/80">· {title}</span> : null}
        <div className="min-w-0 flex-1" />
        {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
      </header>

      <div className="flex min-h-0 flex-1 gap-2.5 lg:gap-3">
        <AppSidebar collapsed={collapsed} activeHref={activeHref} />
        <main className="desk-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
