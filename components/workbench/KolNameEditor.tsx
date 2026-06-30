"use client";

import { Pencil, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";

export function KolNameEditor({
  kolId,
  initialName,
  email
}: {
  kolId: string;
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiClient.kols.update(kolId, { name: name.trim() });
      setEditing(false);
      router.refresh();
    } catch (error) {
      window.alert(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0">
      <p className="m-0 text-xs font-medium text-muted">达人卡片</p>
      {editing ? (
        <div className="mt-1 flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field-glass h-10 min-w-0 flex-1 px-3 text-lg font-semibold"
            autoFocus
          />
          <button
            type="button"
            disabled={saving}
            onClick={saveName}
            className="primary-island-button h-10 px-3"
          >
            <Save className="size-4" />
            保存
          </button>
        </div>
      ) : (
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <h2 className="m-0 truncate text-2xl font-semibold tracking-tight">{initialName}</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="island-button h-8 shrink-0 px-2 text-xs"
          >
            <Pencil className="size-3.5" />
            改名
          </button>
        </div>
      )}
      <p className="m-0 mt-1 break-all text-sm text-muted">邮箱：{email}</p>
    </div>
  );
}
