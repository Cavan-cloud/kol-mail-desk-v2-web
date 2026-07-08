type Props = {
  eyebrow: string;
  title: string;
  hint?: string;
};

export function BoardPanelTitle({ eyebrow, title, hint }: Props) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">{eyebrow}</p>
        <h2 className="m-0 mt-1 text-lg font-semibold">{title}</h2>
      </div>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}
