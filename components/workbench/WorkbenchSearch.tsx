"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

export function WorkbenchSearch({
  initialQuery = "",
  placeholder = "搜索达人、邮箱、主题或摘要"
}: {
  initialQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const trimmed = value.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("kol");
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="relative mx-auto max-w-xl" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="搜索"
        placeholder={placeholder}
        className="field-glass h-9 w-full pl-9 pr-14 text-sm"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-muted shadow-inset">
        Ctrl K
      </span>
    </form>
  );
}
