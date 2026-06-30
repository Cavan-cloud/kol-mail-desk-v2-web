export function PageSpinner({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center text-sm text-muted">
      <div className="flex flex-col items-center gap-3">
        <span className="size-8 animate-spin rounded-full border-2 border-lovart/30 border-t-lovart" />
        {label}
      </div>
    </div>
  );
}
