import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type SendEmailRequest = components["schemas"]["SendEmailRequest"];
export type SendEmailResult = components["schemas"]["SendEmailResult"];
export type BatchSendRequest = components["schemas"]["BatchSendRequest"];
export type BatchSendResult = components["schemas"]["BatchSendResult"];

export function buildGmailApi(client: ApiClient) {
  return {
    /** POST /api/v1/gmail/send — 单发邮件（已人工审核）。 */
    send(body: SendEmailRequest): Promise<SendEmailResult> {
      return unwrap(client.POST("/api/v1/gmail/send", { body }));
    },
    /** POST /api/v1/gmail/batch-send — 批量跟进发送。 */
    batchSend(body: BatchSendRequest): Promise<BatchSendResult> {
      return unwrap(client.POST("/api/v1/gmail/batch-send", { body }));
    },
  };
}

export type GmailApi = ReturnType<typeof buildGmailApi>;
