import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type AiClassifyRequest = components["schemas"]["AiClassifyRequest"];
export type AiClassifyResult = components["schemas"]["AiClassifyResult"];
export type AiDraftRequest = components["schemas"]["AiDraftRequest"];
export type AiDraftResult = components["schemas"]["AiDraftResult"];
export type AiCheckRequest = components["schemas"]["AiCheckRequest"];
export type AiCheckResult = components["schemas"]["AiCheckResult"];
export type AiTranslateRequest = components["schemas"]["AiTranslateRequest"];
export type AiTranslateResult = components["schemas"]["AiTranslateResult"];

interface ResultEnvelope<T> {
  result?: T;
}

function unwrapResult<T>(
  envelope: ResultEnvelope<T> | undefined,
  what: string
): T {
  if (!envelope || envelope.result === undefined) {
    throw new Error(`AI 接口返回空结果：${what}`);
  }
  return envelope.result;
}

export function buildAiApi(client: ApiClient) {
  return {
    /** POST /api/v1/ai/classify — AI 邮件分类。 */
    async classify(body: AiClassifyRequest): Promise<AiClassifyResult> {
      const env = await unwrap(client.POST("/api/v1/ai/classify", { body }));
      return unwrapResult(env as ResultEnvelope<AiClassifyResult>, "classify");
    },
    /** POST /api/v1/ai/draft — AI 草稿生成（中英双版）。 */
    async draft(body: AiDraftRequest): Promise<AiDraftResult> {
      const env = await unwrap(client.POST("/api/v1/ai/draft", { body }));
      return unwrapResult(env as ResultEnvelope<AiDraftResult>, "draft");
    },
    /** POST /api/v1/ai/check — AI 草稿发送前自检。 */
    async check(body: AiCheckRequest): Promise<AiCheckResult> {
      const env = await unwrap(client.POST("/api/v1/ai/check", { body }));
      return unwrapResult(env as ResultEnvelope<AiCheckResult>, "check");
    },
    /** POST /api/v1/ai/translate — 中英互译。 */
    async translate(body: AiTranslateRequest): Promise<AiTranslateResult> {
      const env = await unwrap(client.POST("/api/v1/ai/translate", { body }));
      return unwrapResult(
        env as ResultEnvelope<AiTranslateResult>,
        "translate"
      );
    },
  };
}

export type AiApi = ReturnType<typeof buildAiApi>;
