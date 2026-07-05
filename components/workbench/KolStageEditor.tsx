"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";
import { KOL_STAGES, type KolStage } from "@/lib/domain";

export function KolStageEditor({
  kolId,
  initialStage,
  stageOverride,
}: {
  kolId: string;
  initialStage: KolStage;
  stageOverride?: boolean;
}) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<KolStage>(initialStage);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStage(initialStage);
  }, [kolId, initialStage]);

  async function updateStage(nextStage: KolStage) {
    setStage(nextStage);
    setSaving(true);
    try {
      await apiClient.kols.update(kolId, { stage: nextStage });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workbench.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.kol.detail(kolId) }),
      ]);
    } catch (error) {
      window.alert(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "保存阶段失败");
      setStage(initialStage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted">
        人工校准阶段
        {stageOverride ? <span className="ml-1 text-xs text-accent">(校准)</span> : null}
      </span>
      <select
        value={stage}
        disabled={saving}
        onChange={(event) => updateStage(event.target.value as KolStage)}
        className="field-glass h-10 px-3 disabled:opacity-60"
      >
        {KOL_STAGES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
