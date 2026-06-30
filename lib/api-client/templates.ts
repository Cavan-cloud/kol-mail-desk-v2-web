import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type EmailTemplate = components["schemas"]["EmailTemplate"];
export type TemplateUpsertRequest =
  components["schemas"]["TemplateUpsertRequest"];
export type PageMeta = components["schemas"]["PageMeta"];

export interface TemplateListResponse {
  data?: EmailTemplate[];
  page?: PageMeta;
}

export function buildTemplatesApi(client: ApiClient) {
  return {
    /** GET /api/v1/templates — 模板列表。 */
    list(): Promise<TemplateListResponse> {
      return unwrap(client.GET("/api/v1/templates", {}));
    },
    /** POST /api/v1/templates — 新建模板。 */
    create(body: TemplateUpsertRequest): Promise<EmailTemplate> {
      return unwrap(client.POST("/api/v1/templates", { body }));
    },
    /** PATCH /api/v1/templates/{id} — 编辑模板。 */
    update(id: string, body: TemplateUpsertRequest): Promise<EmailTemplate> {
      return unwrap(
        client.PATCH("/api/v1/templates/{id}", {
          params: { path: { id } },
          body,
        })
      );
    },
    /** DELETE /api/v1/templates/{id} — 删除模板。 */
    async remove(id: string): Promise<void> {
      await unwrap(
        client.DELETE("/api/v1/templates/{id}", {
          params: { path: { id } },
        })
      );
    },
  };
}

export type TemplatesApi = ReturnType<typeof buildTemplatesApi>;
