import { createApiClient, type ApiClient, type CreateApiClientOptions } from "./http";
import { buildAiApi, type AiApi } from "./ai";
import { buildAuthApi, GOOGLE_LOGIN_URL, type AuthApi } from "./auth";
import { buildBoardApi, type BoardApi } from "./board";
import { buildEmailsApi, type EmailsApi } from "./emails";
import { buildGmailApi, type GmailApi } from "./gmail";
import { buildKolsApi, type KolsApi } from "./kols";
import { buildScheduledApi, type ScheduledApi } from "./scheduled";
import { buildSyncApi, type SyncApi } from "./sync";
import { buildTeamApi, type TeamApi } from "./team";
import { buildTemplatesApi, type TemplatesApi } from "./templates";
import { buildWorkbenchApi, type WorkbenchApi } from "./workbench";

export * from "./error";
export * from "./http";
export type { components, operations, paths } from "./types.gen";
export { GOOGLE_LOGIN_URL };

export interface MailDeskApi {
  raw: ApiClient;
  auth: AuthApi;
  workbench: WorkbenchApi;
  kols: KolsApi;
  emails: EmailsApi;
  board: BoardApi;
  team: TeamApi;
  templates: TemplatesApi;
  scheduled: ScheduledApi;
  sync: SyncApi;
  gmail: GmailApi;
  ai: AiApi;
}

/**
 * 创建按子域分包的 MailDesk API 客户端。
 *
 * 用法（应用根级单例）：
 *   import { apiClient } from "@/lib/api-client";
 *   const me = await apiClient.auth.me();
 *
 * 用法（测试 / SSR 注入定制 fetch）：
 *   const client = createMailDeskApi({ fetch: mockFetch, baseUrl: "http://x" });
 */
export function createMailDeskApi(
  opts: CreateApiClientOptions = {}
): MailDeskApi {
  const raw = createApiClient(opts);
  return {
    raw,
    auth: buildAuthApi(raw),
    workbench: buildWorkbenchApi(raw),
    kols: buildKolsApi(raw),
    emails: buildEmailsApi(raw),
    board: buildBoardApi(raw),
    team: buildTeamApi(raw),
    templates: buildTemplatesApi(raw),
    scheduled: buildScheduledApi(raw),
    sync: buildSyncApi(raw),
    gmail: buildGmailApi(raw),
    ai: buildAiApi(raw),
  };
}

/**
 * 默认共享实例，读 NEXT_PUBLIC_API_BASE_URL；
 * 服务端 RSC 与客户端组件均可直接 import 使用。
 */
export const apiClient: MailDeskApi = createMailDeskApi();
