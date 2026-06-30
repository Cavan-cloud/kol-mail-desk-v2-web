"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

// Two-way 已读/未读 toggle. Previously this was one-way (only 标记已读).
// Surfacing 标记未读 explicitly lets the user re-flag a thread when the
// auto-read-on-open caught it before they actually triaged it.
export function MarkEmailReadButton({ emailId, isRead }: { emailId: string; isRead: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function flip() {
    setLoading(true);
    try {
      await apiClient.emails.update(emailId, { isRead: !isRead });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const label = isRead ? "标记未读" : "标记已读";
  const Icon = loading ? Loader2 : isRead ? Circle : CheckCircle2;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={flip}
      className="island-button h-8 px-2.5 text-xs"
      title={label}
    >
      <Icon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}
