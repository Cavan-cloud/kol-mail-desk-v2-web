import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type GmailSyncRequest = components["schemas"]["GmailSyncRequest"];
export type GmailSyncStatus = components["schemas"]["GmailSyncStatus"];
export type FeishuSyncStatus = components["schemas"]["FeishuSyncStatus"];

export function buildSyncApi(client: ApiClient) {
  return {
    /** POST /api/v1/sync/gmail — 触发 Gmail 同步（增量 / 历史）。默认 mode=incremental。 */
    triggerGmail(
      body: Partial<GmailSyncRequest> = {}
    ): Promise<GmailSyncStatus> {
      const payload: GmailSyncRequest = { mode: "incremental", ...body };
      return unwrap(client.POST("/api/v1/sync/gmail", { body: payload }));
    },
    /** GET /api/v1/sync/gmail/status — Gmail 同步进度。 */
    gmailStatus(): Promise<GmailSyncStatus> {
      return unwrap(client.GET("/api/v1/sync/gmail/status", {}));
    },
    /** POST /api/v1/sync/feishu — 触发飞书同步（只读拉取 Sheet → kols）。 */
    triggerFeishu(): Promise<FeishuSyncStatus> {
      return unwrap(client.POST("/api/v1/sync/feishu", {}));
    },
  };
}

export type SyncApi = ReturnType<typeof buildSyncApi>;
