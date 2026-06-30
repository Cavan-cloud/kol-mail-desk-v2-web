import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type Email = components["schemas"]["Email"];
export type EmailUpdateRequest = components["schemas"]["EmailUpdateRequest"];

export function buildEmailsApi(client: ApiClient) {
  return {
    /** PATCH /api/v1/emails/{emailId} — 标记邮件已读 / 未读。 */
    update(emailId: string, body: EmailUpdateRequest): Promise<Email> {
      return unwrap(
        client.PATCH("/api/v1/emails/{emailId}", {
          params: { path: { emailId } },
          body,
        })
      );
    },
    /** DELETE /api/v1/emails/{emailId} — 删除邮件。 */
    async remove(emailId: string): Promise<void> {
      await unwrap(
        client.DELETE("/api/v1/emails/{emailId}", {
          params: { path: { emailId } },
        })
      );
    },
    /** POST /api/v1/emails/{emailId}/reclassify — 重新跑 AI 分类。 */
    reclassify(emailId: string): Promise<Email> {
      return unwrap(
        client.POST("/api/v1/emails/{emailId}/reclassify", {
          params: { path: { emailId } },
        })
      );
    },
  };
}

export type EmailsApi = ReturnType<typeof buildEmailsApi>;
