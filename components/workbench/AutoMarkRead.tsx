"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

// Auto-marks the inbound emails currently shown in the detail pane as read.
// Opening a KOL and seeing their messages should clear the unread state the
// same way reading any inbox does — no manual "标记已读" click required.
//
// `emailIds` must contain ONLY inbound && unread email ids (computed on the
// server) so we never fire redundant calls for outbound or already-read mail.
export function AutoMarkRead({ emailIds }: { emailIds: string[] }) {
  const router = useRouter();
  // Guard against re-firing for the same set across re-renders / Strict Mode.
  const doneKey = useRef<string | null>(null);

  useEffect(() => {
    if (emailIds.length === 0) return;
    const key = emailIds.slice().sort().join(",");
    if (doneKey.current === key) return;
    doneKey.current = key;

    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        emailIds.map((id) => apiClient.emails.update(id, { isRead: true }))
      );
      const anyOk = results.some((r) => r.status === "fulfilled");
      // Refresh so the unread badge/count and list dot update immediately.
      if (!cancelled && anyOk) router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [emailIds, router]);

  return null;
}
