import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type ScheduledEmail = components["schemas"]["ScheduledEmail"];
export type ScheduledEmailCreateRequest =
  components["schemas"]["ScheduledEmailCreateRequest"];
export type PageMeta = components["schemas"]["PageMeta"];

export interface ScheduledEmailListResponse {
  data?: ScheduledEmail[];
  page?: PageMeta;
}

export function buildScheduledApi(client: ApiClient) {
  return {
    /** GET /api/v1/scheduled-emails — 定时邮件列表。 */
    list(): Promise<ScheduledEmailListResponse> {
      return unwrap(client.GET("/api/v1/scheduled-emails", {}));
    },
    /** POST /api/v1/scheduled-emails — 创建定时邮件。 */
    create(body: ScheduledEmailCreateRequest): Promise<ScheduledEmail> {
      return unwrap(client.POST("/api/v1/scheduled-emails", { body }));
    },
    /** DELETE /api/v1/scheduled-emails/{id} — 取消定时邮件（仅未发送可取消）。 */
    async cancel(id: string): Promise<void> {
      await unwrap(
        client.DELETE("/api/v1/scheduled-emails/{id}", {
          params: { path: { id } },
        })
      );
    },
  };
}

export type ScheduledApi = ReturnType<typeof buildScheduledApi>;
