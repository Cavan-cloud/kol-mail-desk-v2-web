import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type Kol = components["schemas"]["Kol"];
export type KolDetail = components["schemas"]["KolDetail"];
export type KolUpdateRequest = components["schemas"]["KolUpdateRequest"];
export type KolAssignRequest = components["schemas"]["KolAssignRequest"];
export interface KolAssignResult {
  assignedCount?: number;
}

export function buildKolsApi(client: ApiClient) {
  return {
    /** GET /api/v1/kols/{kolId} — KOL 详情 + 邮件时间线。 */
    get(kolId: string): Promise<KolDetail> {
      return unwrap(
        client.GET("/api/v1/kols/{kolId}", { params: { path: { kolId } } })
      );
    },
    /** PATCH /api/v1/kols/{kolId} — 编辑 KOL。 */
    update(kolId: string, body: KolUpdateRequest): Promise<Kol> {
      return unwrap(
        client.PATCH("/api/v1/kols/{kolId}", {
          params: { path: { kolId } },
          body,
        })
      );
    },
    /** POST /api/v1/kols/assign — Leader 分配离职遗留达人。 */
    assign(body: KolAssignRequest): Promise<KolAssignResult> {
      return unwrap(client.POST("/api/v1/kols/assign", { body }));
    },
  };
}

export type KolsApi = ReturnType<typeof buildKolsApi>;
