import type { Page, Route } from "@playwright/test";

const KOL_ID = "11111111-1111-4111-8111-111111111111";

const mockProfile = {
  id: "22222222-2222-4222-8222-222222222222",
  displayName: "E2E 测试用户",
  email: "e2e@lovart.test",
  role: "full_time",
  status: "active",
  gmailAuthorized: true,
};

const mockWorkbench = {
  data: [
    {
      id: KOL_ID,
      email: "creator@example.com",
      name: "E2E 测试达人",
      handle: "@e2e_creator",
      primaryPlatform: "tiktok",
      type: "达人",
      source: "feishu",
      stage: "replied",
      status: "active",
      ownerUserId: mockProfile.id,
      ownerName: mockProfile.displayName,
      unreadCount: 1,
      unreplied: true,
      awaitingReply: false,
      replyResolved: false,
      latestEmail: {
        id: "33333333-3333-4333-8333-333333333333",
        kolId: KOL_ID,
        userId: mockProfile.id,
        direction: "inbound",
        fromEmail: "creator@example.com",
        toEmails: ["team@lovart.test"],
        subject: "E2E 测试邮件主题",
        bodyText: "Hello from E2E smoke test.",
        sentAt: new Date().toISOString(),
        aiSummary: "E2E 摘要占位",
        aiPriority: "medium",
        isRead: false,
      },
    },
  ],
  sidebar: {
    total: 1,
    unread: 1,
    unreplied: 1,
    stageCounts: { all: 1, unreplied: 1, replied: 1 },
  },
  page: { page: 1, size: 50, total: 1 },
};

const mockKolDetail = {
  kol: mockWorkbench.data[0],
  ownerName: mockProfile.displayName,
  emails: [mockWorkbench.data[0].latestEmail],
};

const mockBoard = {
  window: "all",
  kpi: {
    totalKols: 1,
    activeKols: 1,
    publishedKols: 0,
    paidKols: 0,
    conversionRate: 0,
  },
  funnel: [
    { stage: "outreach", label: "触达", count: 1 },
    { stage: "replied", label: "回复", count: 1 },
  ],
  stageDistribution: [{ stage: "replied", label: "回复", count: 1 }],
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

/** 模拟已登录会话（拦截 Spring API，无需真实 OAuth）。 */
export async function mockAuthenticatedApi(page: Page) {
  await page.route("**/api/v1/me", (route) => json(route, mockProfile));
  await page.route("**/api/v1/workbench**", (route) => json(route, mockWorkbench));
  await page.route("**/api/v1/kols/**", (route) => json(route, mockKolDetail));
  await page.route("**/api/v1/templates", (route) => json(route, { data: [], page: { page: 1, size: 50, total: 0 } }));
  await page.route("**/api/v1/team/members", (route) =>
    json(route, { members: [{ ...mockProfile, ownedKolCount: 1 }], pool: [] })
  );
  await page.route("**/api/v1/board**", (route) => json(route, mockBoard));
  await page.route("**/api/v1/scheduled-emails", (route) =>
    json(route, { data: [], page: { page: 1, size: 50, total: 0 } })
  );
}

/** 模拟未登录（401）。 */
export async function mockUnauthenticatedApi(page: Page) {
  await page.route("**/api/v1/me", (route) =>
    json(route, { code: "UNAUTHORIZED", message: "未登录" }, 401)
  );
}
