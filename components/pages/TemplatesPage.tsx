"use client";

import { RequireAuth } from "@/components/shell/RequireAuth";
import { PageSpinner } from "@/components/shell/PageSpinner";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { TemplateLibrary } from "@/components/templates/TemplateLibrary";
import { useTemplatesQuery } from "@/lib/api-client/queries";

function TemplatesPageInner() {
  const templatesQuery = useTemplatesQuery();
  const templates = templatesQuery.data?.data ?? [];

  return (
    <AppShell activeHref="/templates" title="邮件模板" headerActions={<SignOutButton />}>
      <div className="mx-auto max-w-[1280px] p-4 lg:p-6">
        {templatesQuery.isLoading ? (
          <PageSpinner label="加载模板…" />
        ) : templatesQuery.isError ? (
          <div className="text-center text-sm text-[#9f3429]">加载模板失败，请刷新重试。</div>
        ) : (
          <TemplateLibrary templates={templates} />
        )}
      </div>
    </AppShell>
  );
}

export function TemplatesPage() {
  return (
    <RequireAuth>
      <TemplatesPageInner />
    </RequireAuth>
  );
}
