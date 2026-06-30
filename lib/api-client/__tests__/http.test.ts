import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  FALLBACK_ERROR_CODES,
  isApiClientError,
} from "../error";
import { createApiClient, resolveApiBaseUrl, unwrap } from "../http";

function jsonResponse(
  status: number,
  body: unknown,
  init: ResponseInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });
}

describe("resolveApiBaseUrl", () => {
  it("falls back to localhost:8080 when no env is set", () => {
    const original = process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    expect(resolveApiBaseUrl()).toBe("http://localhost:8080");
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_API_BASE_URL = original;
    }
  });

  it("prefers explicit value over env", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://from-env";
    expect(resolveApiBaseUrl("http://explicit")).toBe("http://explicit");
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });
});

describe("createApiClient + unwrap", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
  });

  it("拼接 baseURL 并始终带 credentials: include", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { status: "UP" }));
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const data = await unwrap(client.GET("/api/v1/health", {}));

    expect(data).toEqual({ status: "UP" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestArg = fetchMock.mock.calls[0][0] as Request;
    expect(requestArg.url).toBe("http://api.test/api/v1/health");
    expect(requestArg.credentials).toBe("include");
  });

  it("2xx 直接解出 data 字段", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        id: "u-1",
        displayName: "测试用户",
        email: "u@x.com",
        role: "leader",
        status: "active",
        gmailAuthorized: false,
      })
    );
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const me = await unwrap(client.GET("/api/v1/me", {}));
    expect(me).toMatchObject({ id: "u-1", role: "leader" });
  });

  it("4xx 带 ApiError JSON 时抛 ApiClientError 且传播 code/message/details/status", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        code: "BAD_REQUEST",
        message: "请求参数不完整",
        details: { field: "kolId" },
      })
    );
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(
      unwrap(
        client.PATCH("/api/v1/kols/{kolId}", {
          params: { path: { kolId: "00000000-0000-0000-0000-000000000001" } },
          body: { name: "x" },
        })
      )
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: "BAD_REQUEST",
      message: "请求参数不完整",
      status: 400,
      details: { field: "kolId" },
    });
  });

  it("网络层 throw 时抛 ApiClientError(NETWORK_ERROR) 并带 fallback message", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: fetchMock as unknown as typeof fetch,
    });

    let captured: unknown;
    try {
      await unwrap(client.GET("/api/v1/health", {}));
    } catch (e) {
      captured = e;
    }
    expect(isApiClientError(captured)).toBe(true);
    const err = captured as ApiClientError;
    expect(err.code).toBe(FALLBACK_ERROR_CODES.NETWORK_ERROR);
    expect(err.message).toBe("Failed to fetch");
    expect(err.status).toBe(0);
  });

  it("非 JSON 错误体（500 + text/plain）抛 ApiClientError(INVALID_RESPONSE)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("upstream boom", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/plain" },
      })
    );
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: fetchMock as unknown as typeof fetch,
    });

    let captured: unknown;
    try {
      await unwrap(client.GET("/api/v1/health", {}));
    } catch (e) {
      captured = e;
    }
    expect(isApiClientError(captured)).toBe(true);
    const err = captured as ApiClientError;
    expect(err.code).toBe(FALLBACK_ERROR_CODES.INVALID_RESPONSE);
    expect(err.status).toBe(500);
    expect(err.message.length).toBeGreaterThan(0);
  });

  it("204 No Content 路径不抛错且 data 为 undefined", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 204, statusText: "No Content" })
    );
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const result = await unwrap(client.POST("/api/v1/auth/logout", {}));
    expect(result).toBeUndefined();
  });
});
