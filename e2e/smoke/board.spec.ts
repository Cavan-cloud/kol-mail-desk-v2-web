import { expect, test } from "@playwright/test";
import { mockAuthenticatedApi, mockMemberB, mockProfile } from "../helpers/mock-api";

test.describe("Phase 7B board parity @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApi(page);
  });

  test("KPI unreplied drill opens bottom list", async ({ page }) => {
    await page.goto("/board");
    await page.getByRole("link", { name: "待回复 1" }).click();
    await page.waitForURL(/detail=unreplied/);
    await expect(page.getByRole("heading", { name: "待回复达人" })).toBeVisible();
    const drillSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "待回复达人" }),
    });
    await expect(drillSection.getByRole("link", { name: /creator@example.com/ })).toBeVisible();
  });

  test("pipeline stage click drills into stage list", async ({ page }) => {
    await page.goto("/board");
    await page.getByRole("link", { name: "回复 1 100%" }).click();
    await page.waitForURL(/detail=kols/);
    await expect(page).toHaveURL(/stage=replied/);
    await expect(page.getByRole("heading", { name: "回复 · 达人列表" })).toBeVisible();
  });

  test("perspective switch updates owner query", async ({ page }) => {
    await page.goto("/board");
    const selector = page.getByLabel("选择成员视角");
    await selector.click();
    await selector.fill(mockMemberB.displayName);
    await page.getByRole("option", { name: new RegExp(mockMemberB.displayName) }).click();
    await page.waitForURL(new RegExp(`owner=${mockMemberB.id}`));
  });

  test("month filter updates window query", async ({ page }) => {
    await page.goto("/board");
    await page.locator('input[type="month"]').fill("2026-06");
    await page.getByRole("button", { name: "按月" }).click();
    await page.waitForURL(/window=2026-06/);
    await expect(page.getByText("当前：2026年6月")).toBeVisible();
  });
});
