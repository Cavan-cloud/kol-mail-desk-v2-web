import { unwrap, type ApiClient } from "./http";
import type { components, operations } from "./types.gen";

export type BoardSummary = components["schemas"]["BoardSummary"];
export type BoardKol = components["schemas"]["BoardKol"];
export type BoardMemberRow = components["schemas"]["BoardMemberRow"];
export type BoardPlatformSegment = components["schemas"]["BoardPlatformSegment"];
export type BoardKpi = components["schemas"]["BoardKpi"];
export type BoardFunnelStage = components["schemas"]["BoardFunnelStage"];
export type BoardStageDistribution =
  components["schemas"]["BoardStageDistribution"];
export type GetBoardParams =
  NonNullable<operations["getBoard"]["parameters"]["query"]>;

export function buildBoardApi(client: ApiClient) {
  return {
    /** GET /api/v1/board — 看板汇总（KPI + 漏斗 + 阶段分布）。 */
    get(params: GetBoardParams = {}): Promise<BoardSummary> {
      return unwrap(client.GET("/api/v1/board", { params: { query: params } }));
    },
  };
}

export type BoardApi = ReturnType<typeof buildBoardApi>;
