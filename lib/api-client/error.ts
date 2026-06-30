import type { components } from "./types.gen";

export type ApiErrorBody = components["schemas"]["ApiError"];

/**
 * 由 api-client 抛出的强类型错误，对齐 OpenAPI `ApiError` schema：
 * { code, message, details? }。网络/解析失败时 code = NETWORK_ERROR / UNKNOWN。
 */
export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(opts: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "ApiClientError";
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
    this.cause = opts.cause;
  }
}

export function isApiClientError(value: unknown): value is ApiClientError {
  return value instanceof ApiClientError;
}

/**
 * 兜底错误码：用于网络层 / 非 JSON 响应等无法映射到契约 ApiError 的场景。
 */
export const FALLBACK_ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  UNKNOWN: "UNKNOWN",
} as const;
