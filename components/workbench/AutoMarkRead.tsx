"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";

export function AutoMarkRead({
  emailIds,
  kolId,
}: {
  emailIds: string[];
  kolId?: string;
}) {
  const queryClient = useQueryClient();
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
      if (!cancelled && anyOk) {
        const invalidations = [queryClient.invalidateQueries({ queryKey: queryKeys.workbench.all })];
        if (kolId) {
          invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.kol.detail(kolId) }));
        }
        await Promise.all(invalidations);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [emailIds, kolId, queryClient]);

  return null;
}
