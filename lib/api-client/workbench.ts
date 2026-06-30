import { unwrap, type ApiClient } from "./http";
import type { components, operations } from "./types.gen";

export type WorkbenchResponse = components["schemas"]["WorkbenchResponse"];
export type WorkbenchKol = components["schemas"]["WorkbenchKol"];
export type WorkbenchSidebarStats =
  components["schemas"]["WorkbenchSidebarStats"];

export type GetWorkbenchParams =
  NonNullable<operations["getWorkbench"]["parameters"]["query"]>;

export function buildWorkbenchApi(client: ApiClient) {
  return {
    /** GET /api/v1/workbench — 工作台数据（列表 + 侧栏统计 + 分页）。 */
    get(params: GetWorkbenchParams = {}): Promise<WorkbenchResponse> {
      return unwrap(client.GET("/api/v1/workbench", { params: { query: params } }));
    },
  };
}

export type WorkbenchApi = ReturnType<typeof buildWorkbenchApi>;
