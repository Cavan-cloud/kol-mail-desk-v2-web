import { expect, test } from "@playwright/test";
import { mockAuthenticatedApi, mockUnauthenticatedApi } from "../helpers/mock-api";

test.describe("Phase 1 smoke @smoke", () => {
  test("login page shows Google sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "登录 Lovart Mail Desk" })).toBeVisible();
    const loginLink = page.getByRole("link", { name: "使用 Google 登录" });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", /oauth2\/authorization\/google/);
  });

  test("unauthenticated user is redirected to login from workbench", async ({ page }) => {
    await mockUnauthenticatedApi(page);
    await page.goto("/");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "登录 Lovart Mail Desk" })).toBeVisible();
  });

  test("authenticated workbench shows kol list", async ({ page }) => {
    await mockAuthenticatedApi(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /达人列表/ })).toBeVisible();
    const kolList = page.getByRole("region", { name: "达人列表" });
    await expect(kolList.getByRole("link", { name: /E2E 测试达人/ })).toBeVisible();
    await expect(kolList.getByText("E2E 测试邮件主题")).toBeVisible();
  });

  test("authenticated board shows KPI and pipeline", async ({ page }) => {
    await mockAuthenticatedApi(page);
    await page.goto("/board");
    await expect(page.getByText("总达人")).toBeVisible();
    await expect(page.getByText("Pipeline")).toBeVisible();
    await expect(page.getByText("累计漏斗")).toBeVisible();
  });
});
