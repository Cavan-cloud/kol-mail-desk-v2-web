"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { PageSpinner } from "@/components/shell/PageSpinner";
import { isApiClientError } from "@/lib/api-client/error";
import { useMeQuery } from "@/lib/api-client/queries";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useMeQuery();

  useEffect(() => {
    if (isError && isApiClientError(error) && error.status === 401) {
      router.replace("/login");
      return;
    }
    if (data?.status === "pending_approval") {
      router.replace("/onboarding");
    }
  }, [data?.status, error, isError, router]);

  if (isLoading) {
    return (
      <main className="grid min-h-[100dvh] place-items-center">
        <PageSpinner label="验证登录状态…" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="grid min-h-[100dvh] place-items-center">
        <PageSpinner label="正在跳转登录…" />
      </main>
    );
  }

  if (data.status === "pending_approval") {
    return (
      <main className="grid min-h-[100dvh] place-items-center">
        <PageSpinner label="请先完善资料…" />
      </main>
    );
  }

  return children;
}
