import {
  EXTRA_STAGE_FILTERS,
  KOL_STAGES,
  type StageFilter,
  type ViewMode,
} from "@/lib/domain";

const VALID_VIEWS = new Set<string>(["mine", "pool", "all"]);
const VALID_FILTERS = new Set<string>([
  "all",
  "unread",
  "unreplied",
  ...KOL_STAGES.map((stage) => stage.id),
]);

export function normalizeView(value?: string | null): ViewMode {
  const candidate = value ?? "";
  return VALID_VIEWS.has(candidate) ? (candidate as ViewMode) : "mine";
}

export function normalizeStage(value?: string | null): StageFilter {
  return VALID_FILTERS.has(value ?? "") ? (value as StageFilter) : "all";
}

export function workbenchHref(next: {
  view?: ViewMode;
  stage?: StageFilter;
  kol?: string | null;
  q?: string | null;
}) {
  const params = new URLSearchParams();
  params.set("view", next.view ?? "mine");
  params.set("stage", next.stage ?? "all");
  if (next.kol) params.set("kol", next.kol);
  if (next.q) params.set("q", next.q);
  return `/?${params.toString()}`;
}

export function stageChipMeta(
  stageCounts: Record<string, number> | undefined,
  total?: number
) {
  const counts = stageCounts ?? {};
  const chips = [
    {
      id: "all",
      label: "全部",
      description: "当前视图下全部达人",
      count: total ?? counts.all ?? 0,
    },
    ...EXTRA_STAGE_FILTERS.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      count: counts[item.id] ?? 0,
    })),
    ...KOL_STAGES.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      count: counts[item.id] ?? 0,
    })),
  ];
  return chips;
}
