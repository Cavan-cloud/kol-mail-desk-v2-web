import type { Page, Route } from "@playwright/test";

const KOL_ID = "11111111-1111-4111-8111-111111111111";

export const mockProfile = {
  id: "22222222-2222-4222-8222-222222222222",
  displayName: "E2E 测试用户",
  email: "e2e@lovart.test",
  role: "full_time",
  status: "active",
  gmailAuthorized: true,
};

export const mockMemberB = {
  id: "33333333-3333-4333-8333-333333333333",
  displayName: "E2E 成员 B",
  email: "member-b@lovart.test",
  role: "full_time",
  status: "active",
  gmailAuthorized: true,
};

const mockKolBoardRow = {
  id: KOL_ID,
  name: "E2E 测试达人",
  email: "creator@example.com",
  stage: "replied",
  primaryPlatform: "tiktok",
  type: "达人",
  unreadCount: 1,
  unreplied: true,
  latestEmail: {
    subject: "E2E 测试邮件主题",
    aiSummary: "E2E 摘要占位",
    aiPriority: "medium",
    direction: "inbound",
    sentAt: new Date().toISOString(),
  },
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
        id: "44444444-4444-4444-8444-444444444444",
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
    teamPool: 0,
    stageCounts: { unreplied: 1, unread: 1, replied: 1, outreach: 0 },
  },
  page: { page: 1, size: 50, total: 1 },
};

const mockKolDetail = {
  kol: mockWorkbench.data[0],
  ownerName: mockProfile.displayName,
  emails: [mockWorkbench.data[0].latestEmail],
};

const baseMockBoard = {
  window: "all",
  includeInterns: true,
  kpi: {
    totalKols: 1,
    unrepliedKols: 1,
    unreadEmails: 1,
    cooperationKols: 0,
    conversionRate: 0,
  },
  funnel: [
    { stage: "outreach", label: "触达", count: 1 },
    { stage: "replied", label: "回复", count: 1 },
  ],
  stageDistribution: [{ stage: "replied", label: "回复", count: 1 }],
  kols: [] as typeof mockKolBoardRow[],
  members: [
    {
      memberId: mockProfile.id,
      displayName: mockProfile.displayName,
      role: mockProfile.role,
      coveredMemberIds: [mockProfile.id],
      stageCounts: { replied: 1 },
      total: 1,
      unread: 1,
      unreplied: 1,
    },
  ],
  platformDistribution: [{ platform: "tiktok", label: "TikTok", count: 1 }],
  recentActivity: [mockKolBoardRow],
  availableMonths: ["2026-06", "2026-05"],
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export function buildMockBoard(requestUrl: string) {
  const url = new URL(requestUrl);
  const detail = url.searchParams.get("detail");
  const stage = url.searchParams.get("stage");
  const owner = url.searchParams.get("owner");
  const window = url.searchParams.get("window") ?? "all";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const size = Math.max(1, parseInt(url.searchParams.get("size") ?? "20", 10) || 20);

  const board = {
    ...baseMockBoard,
    window,
    selectedOwnerId: owner,
    includeInterns: url.searchParams.get("includeInterns") !== "0",
    kolsPage: undefined as { page: number; size: number; total: number } | undefined,
  };

  let allKols: typeof mockKolBoardRow[] = [];

  if (detail === "unreplied") {
    allKols = [mockKolBoardRow];
    board.kpi = { ...board.kpi, unrepliedKols: 1 };
  } else if (detail === "unread") {
    allKols = [mockKolBoardRow];
    board.kpi = { ...board.kpi, unreadEmails: 1 };
  } else if (detail === "kols") {
    allKols = stage
      ? mockKolBoardRow.stage === stage
        ? [mockKolBoardRow]
        : []
      : [mockKolBoardRow];
  }

  if (detail) {
    const total = allKols.length;
    const start = (page - 1) * size;
    board.kols = allKols.slice(start, start + size);
    board.kolsPage = { page, size, total };
  }

  return board;
}

/** 模拟已登录会话（拦截 Spring API，无需真实 OAuth）。 */
export async function mockAuthenticatedApi(page: Page) {
  await page.route("**/api/v1/me", (route) => json(route, mockProfile));
  await page.route("**/api/v1/workbench**", (route) => json(route, mockWorkbench));
  await page.route("**/api/v1/kols/**", (route) => json(route, mockKolDetail));
  await page.route("**/api/v1/templates", (route) => json(route, { data: [], page: { page: 1, size: 50, total: 0 } }));
  await page.route("**/api/v1/team/members", (route) =>
    json(route, {
      members: [
        { ...mockProfile, ownedKolCount: 1 },
        { ...mockMemberB, ownedKolCount: 0 },
      ],
      pool: [],
    })
  );
  await page.route("**/api/v1/board**", (route) => json(route, buildMockBoard(route.request().url())));
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
