import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type Profile = components["schemas"]["Profile"];

/**
 * 浏览器直接跳转的 Google 登录入口（Spring Security 自带 302），
 * 不通过 fetch 调用，提供常量供 `<a href>` 使用。
 */
export const GOOGLE_LOGIN_URL = "/oauth2/authorization/google";

export function buildAuthApi(client: ApiClient) {
  return {
    /** GET /api/v1/me — 当前登录用户资料。 */
    me(): Promise<Profile> {
      return unwrap(client.GET("/api/v1/me", {}));
    },
    /** POST /api/v1/auth/logout — 退出登录（清 Cookie）。 */
    async logout(): Promise<void> {
      await unwrap(client.POST("/api/v1/auth/logout", {}));
    },
    /**
     * GET /api/v1/gmail/authorize — 触发 Gmail 增量授权，通常浏览器直接跳转。
     * 这里提供常量便于在 `<a href>` 中使用；如需 fetch 调用请自行处理 302。
     */
    GMAIL_AUTHORIZE_URL: "/api/v1/gmail/authorize" as const,
  };
}

export type AuthApi = ReturnType<typeof buildAuthApi>;
