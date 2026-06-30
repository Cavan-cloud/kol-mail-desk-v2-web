import createClient, { type Client, type Middleware } from "openapi-fetch";
import {
  ApiClientError,
  FALLBACK_ERROR_CODES,
  type ApiErrorBody,
} from "./error";
import type { paths } from "./types.gen";

export type ApiClient = Client<paths>;

export interface CreateApiClientOptions {
  /** 后端 base URL；默认读 NEXT_PUBLIC_API_BASE_URL，再 fallback 到 http://localhost:8080。 */
  baseUrl?: string;
  /** 注入自定义 fetch，主要用于测试。 */
  fetch?: typeof fetch;
  /** 额外的中间件，按顺序追加。 */
  middlewares?: Middleware[];
}

export const DEFAULT_API_BASE_URL = "http://localhost:8080";

export function resolveApiBaseUrl(explicit?: string): string {
  if (explicit && explicit.length > 0) return explicit;
  const envUrl =
    typeof process !== "undefined" && typeof process.env !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : undefined;
  return envUrl && envUrl.length > 0 ? envUrl : DEFAULT_API_BASE_URL;
}

/**
 * 创建强类型的 openapi-fetch 客户端实例。
 *
 * 默认行为：
 * - 自动拼接 NEXT_PUBLIC_API_BASE_URL（默认 http://localhost:8080）
 * - 始终带上 credentials: 'include'，让后端下发的 HttpOnly 会话 Cookie 自动携带
 * - 请求/响应默认 Content-Type: application/json
 *
 * 不在本层做错误抛出 —— 各子域封装通过 `unwrap` 把 `{ data, error, response }`
 * 转成「成功 → data；失败 → throw ApiClientError」的语义。
 */
export function createApiClient(opts: CreateApiClientOptions = {}): ApiClient {
  const client = createClient<paths>({
    baseUrl: resolveApiBaseUrl(opts.baseUrl),
    credentials: "include",
    fetch: opts.fetch,
    headers: { "Content-Type": "application/json" },
  });
  if (opts.middlewares && opts.middlewares.length > 0) {
    client.use(...opts.middlewares);
  }
  return client;
}

interface OpenApiFetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * 把 openapi-fetch 的 `{ data, error, response }` 三元组归一为：
 * - 2xx 且后端有返回体 → 直接返回 data
 * - 2xx 但无返回体（如 204） → 返回 undefined（调用方应当用 `Promise<void>` 接收）
 * - 4xx/5xx → 抛 ApiClientError（尽量映射契约 ApiError；否则用 fallback code）
 */
export async function unwrap<T>(
  promise: Promise<OpenApiFetchResult<T>>
): Promise<T> {
  let result: OpenApiFetchResult<T>;
  try {
    result = await promise;
  } catch (cause) {
    throw new ApiClientError({
      code: FALLBACK_ERROR_CODES.NETWORK_ERROR,
      message: cause instanceof Error ? cause.message : "网络请求失败",
      status: 0,
      cause,
    });
  }

  const { data, error, response } = result;
  if (response.ok) {
    return data as T;
  }
  throw mapErrorResponse(error, response);
}

function mapErrorResponse(error: unknown, response: Response): ApiClientError {
  if (isApiErrorBody(error)) {
    return new ApiClientError({
      code: error.code,
      message: error.message,
      status: response.status,
      details: error.details,
    });
  }
  return new ApiClientError({
    code: FALLBACK_ERROR_CODES.INVALID_RESPONSE,
    message: extractFallbackMessage(error, response),
    status: response.status,
    details: typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : undefined,
  });
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.code === "string" && typeof v.message === "string";
}

function extractFallbackMessage(error: unknown, response: Response): string {
  if (typeof error === "string" && error.length > 0) return error;
  if (response.statusText && response.statusText.length > 0) {
    return `${response.status} ${response.statusText}`;
  }
  return `HTTP ${response.status}`;
}
