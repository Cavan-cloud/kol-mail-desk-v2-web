import { Suspense } from "react";
import { BoardPage } from "@/components/pages/BoardPage";
import { PageSpinner } from "@/components/shell/PageSpinner";

export default function BoardRoutePage() {
  return (
    <Suspense fallback={<PageSpinner label="加载看板…" />}>
      <BoardPage />
    </Suspense>
  );
}
