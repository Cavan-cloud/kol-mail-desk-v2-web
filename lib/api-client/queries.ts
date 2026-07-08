import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./index";
import type { GetBoardParams, BoardSummary } from "./board";
import type { GetWorkbenchParams, WorkbenchResponse } from "./workbench";
import type { Profile } from "./auth";
import type { KolDetail } from "./kols";
import type { TeamMembersResponse } from "./team";
import type { TemplateListResponse } from "./templates";
import type { ScheduledEmailListResponse } from "./scheduled";

/**
 * 集中维护的 query key 工厂。后续子域 hook 复用同一前缀，便于 invalidate。
 */
export const queryKeys = {
  workbench: {
    all: ["workbench"] as const,
    list: (params: GetWorkbenchParams) =>
      ["workbench", "list", params] as const,
  },
  me: ["auth", "me"] as const,
  board: (params: GetBoardParams = {}) => ["board", params] as const,
  team: {
    members: ["team", "members"] as const,
  },
  templates: {
    list: ["templates", "list"] as const,
  },
  scheduled: {
    list: ["scheduled", "list"] as const,
  },
  syncGmail: {
    status: ["sync", "gmail", "status"] as const,
  },
  kol: {
    detail: (kolId: string) => ["kol", "detail", kolId] as const,
  },
} as const;

/**
 * 示例 hook：拉取工作台数据；其余子域 hook 待后续 ticket 按需添加。
 */
export function useWorkbenchQuery(params: GetWorkbenchParams = {}) {
  return useQuery<WorkbenchResponse>({
    queryKey: queryKeys.workbench.list(params),
    queryFn: () => apiClient.workbench.get(params),
  });
}

/**
 * 示例 hook：拉取当前登录用户资料。失败（如 401）不自动重试，交由调用方处理。
 */
export function useMeQuery() {
  return useQuery<Profile>({
    queryKey: queryKeys.me,
    queryFn: () => apiClient.auth.me(),
    retry: false,
  });
}

export function useBoardQuery(params: GetBoardParams = {}) {
  return useQuery<BoardSummary>({
    queryKey: queryKeys.board(params),
    queryFn: () => apiClient.board.get(params),
  });
}

export function useTeamMembersQuery() {
  return useQuery<TeamMembersResponse>({
    queryKey: queryKeys.team.members,
    queryFn: () => apiClient.team.listMembers(),
  });
}

export function useTemplatesQuery() {
  return useQuery<TemplateListResponse>({
    queryKey: queryKeys.templates.list,
    queryFn: () => apiClient.templates.list(),
  });
}

export function useScheduledQuery() {
  return useQuery<ScheduledEmailListResponse>({
    queryKey: queryKeys.scheduled.list,
    queryFn: () => apiClient.scheduled.list(),
  });
}

export function useKolDetailQuery(kolId: string | null | undefined) {
  return useQuery<KolDetail>({
    queryKey: queryKeys.kol.detail(kolId ?? ""),
    queryFn: () => apiClient.kols.get(kolId!),
    enabled: Boolean(kolId),
  });
}
