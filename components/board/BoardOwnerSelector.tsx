"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { boardHref, type BoardQueryState } from "@/lib/board-nav";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain";

type MemberOption = {
  id?: string;
  displayName?: string | null;
  role?: string | null;
};

type Props = {
  members: MemberOption[];
  selectedOwnerId: string | null;
  boardState: BoardQueryState;
};

export function BoardOwnerSelector({ members, selectedOwnerId, boardState }: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedMember = members.find((member) => member.id === selectedOwnerId);
  const selectedLabel = selectedOwnerId ? (selectedMember?.displayName ?? "未命名") : "全部成员";

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) =>
      (member.displayName ?? "").toLowerCase().includes(needle)
    );
  }, [members, query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function navigateOwner(owner: string | null) {
    router.push(
      boardHref({
        ...boardState,
        owner,
      })
    );
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative min-w-[220px] flex-1 sm:max-w-xs">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={open ? query : selectedLabel}
          placeholder="搜索成员姓名…"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          className="focus-ring h-9 w-full rounded-full border border-white/70 bg-white/72 py-0 pl-9 pr-9 text-sm font-semibold text-ink shadow-inset outline-none focus:border-lovart/40"
          aria-label="选择成员视角"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/70 bg-white/95 p-1 shadow-lg backdrop-blur"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!selectedOwnerId}
              onClick={() => navigateOwner(null)}
              className={`focus-ring w-full rounded-xl px-3 py-2 text-left text-sm ${
                !selectedOwnerId ? "bg-lovart-soft font-semibold text-[#9a5a00]" : "hover:bg-black/[0.04]"
              }`}
            >
              全部成员
            </button>
          </li>
          {filtered.map((member) =>
            member.id ? (
              <li key={member.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedOwnerId === member.id}
                  onClick={() => navigateOwner(member.id!)}
                  className={`focus-ring w-full rounded-xl px-3 py-2 text-left text-sm ${
                    selectedOwnerId === member.id
                      ? "bg-lovart-soft font-semibold text-[#9a5a00]"
                      : "hover:bg-black/[0.04]"
                  }`}
                >
                  <span>{member.displayName ?? "未命名"}</span>
                  <span className="ml-2 text-xs text-muted">
                    {USER_ROLE_LABELS[(member.role ?? "full_time") as UserRole] ?? member.role}
                  </span>
                </button>
              </li>
            ) : null
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">无匹配成员</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
