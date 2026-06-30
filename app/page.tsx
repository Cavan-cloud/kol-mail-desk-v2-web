import { Suspense } from "react";
import { WorkbenchPage } from "@/components/pages/WorkbenchPage";
import { PageSpinner } from "@/components/shell/PageSpinner";

export default function HomePage() {
  return (
    <Suspense fallback={<PageSpinner label="加载工作台…" />}>
      <WorkbenchPage />
    </Suspense>
  );
}
