import { Clock3, Inbox, LayoutGrid, Mail, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LovartMark } from "@/components/common/LovartMark";

export type AppNavLink = {
  href: string;
  label: string;
  icon: ReactNode;
};

export const APP_NAV: AppNavLink[] = [
  { href: "/", label: "工作台", icon: <Inbox className="size-5" /> },
  { href: "/board", label: "团队看板", icon: <LayoutGrid className="size-5" /> },
  { href: "/team", label: "团队成员", icon: <UsersRound className="size-5" /> },
  { href: "/templates", label: "邮件模板", icon: <Mail className="size-5" /> },
  { href: "/scheduled", label: "定时邮件", icon: <Clock3 className="size-5" /> }
];

export function AppBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LovartMark className="size-8 drop-shadow-sm" />
      {!collapsed ? (
        <span className="hidden text-sm font-semibold tracking-tight sm:inline">Lovart Mail Desk</span>
      ) : null}
    </span>
  );
}

export function AppSidebar({
  collapsed,
  activeHref,
  badges,
  footer
}: {
  collapsed: boolean;
  activeHref: string;
  badges?: Record<string, number>;
  footer?: ReactNode;
}) {
  return (
    <nav
      aria-label="主导航"
      className={`glass-rail flex shrink-0 flex-col gap-1 overflow-hidden rounded-2xl p-2 transition-[width] duration-300 ease-fluid ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex flex-1 flex-col gap-1">
        {APP_NAV.map((item) => {
          const active = item.href === activeHref;
          const badge = badges?.[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={active ? "page" : undefined}
              className={`focus-ring relative flex h-10 items-center overflow-hidden whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-200 ${
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              } ${
                active
                  ? "border border-lovart/30 bg-lovart-soft text-[#9a5a00] shadow-float"
                  : "border border-transparent text-muted hover:bg-white/70 hover:text-ink"
              }`}
            >
              <span className="grid size-5 shrink-0 place-items-center">{item.icon}</span>
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
              {badge ? (
                collapsed ? (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-lovart shadow-float" />
                ) : (
                  <span className="ml-auto rounded-full bg-lovart px-2 py-0.5 text-xs font-bold text-[#231506] shadow-float">
                    {badge}
                  </span>
                )
              ) : null}
            </Link>
          );
        })}
      </div>
      {footer ? <div className={collapsed ? "flex justify-center" : ""}>{footer}</div> : null}
    </nav>
  );
}
