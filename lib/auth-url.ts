import { GOOGLE_LOGIN_URL } from "@/lib/api-client/auth";
import { resolveApiBaseUrl } from "@/lib/api-client/http";

/** 浏览器跳转 Google OAuth 的完整 URL（指向 Spring 后端）。 */
export function buildGoogleLoginUrl(): string {
  const base = resolveApiBaseUrl().replace(/\/$/, "");
  return `${base}${GOOGLE_LOGIN_URL}`;
}
