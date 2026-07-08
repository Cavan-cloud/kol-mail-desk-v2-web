import { KOL_STAGES, type KolStage } from "@/lib/domain";

export type BoardDetail = "kols" | "unreplied" | "unread";

export type BoardQueryState = {
  window?: string;
  owner?: string | null;
  includeInterns?: boolean;
  detail?: BoardDetail | null;
  stage?: KolStage | null;
  page?: number;
};

const VALID_DETAILS = new Set<string>(["kols", "unreplied", "unread"]);

export function normalizeBoardDetail(value?: string | null): BoardDetail | null {
  const candidate = value ?? "";
  return VALID_DETAILS.has(candidate) ? (candidate as BoardDetail) : null;
}

export function boardQueryString(state: BoardQueryState): string {
  const params = new URLSearchParams();
  const window = state.window ?? "all";
  if (window && window !== "all") {
    params.set("window", window);
  }
  if (state.owner) {
    params.set("owner", state.owner);
  }
  if (state.includeInterns === false) {
    params.set("includeInterns", "0");
  }
  if (state.detail) {
    params.set("detail", state.detail);
  }
  if (state.stage) {
    params.set("stage", state.stage);
  }
  if (state.page && state.page > 1) {
    params.set("page", String(state.page));
  }
  return params.toString();
}

export function boardHref(state: BoardQueryState): string {
  const qs = boardQueryString(state);
  return qs ? `/board?${qs}` : "/board";
}

export function parseBoardSearchParams(searchParams: URLSearchParams): BoardQueryState {
  const includeInternsRaw = searchParams.get("includeInterns");
  return {
    window: searchParams.get("window") ?? "all",
    owner: searchParams.get("owner"),
    includeInterns: includeInternsRaw !== "0",
    detail: normalizeBoardDetail(searchParams.get("detail")),
    stage: (searchParams.get("stage") as KolStage | null) ?? null,
    page: parsePage(searchParams.get("page")),
  };
}

function parsePage(value: string | null): number {
  const page = parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function detailLabel(detail: BoardDetail | null, stage: KolStage | null): string | null {
  if (!detail) return null;
  if (stage) {
    const stageLabel = KOL_STAGES.find((item) => item.id === stage)?.label ?? stage;
    return `${stageLabel} · 达人列表`;
  }
  if (detail === "unread") return "未读达人";
  if (detail === "unreplied") return "待回复达人";
  return "全部达人";
}
