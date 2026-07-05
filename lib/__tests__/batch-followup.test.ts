import { describe, expect, it } from "vitest";
import {
  batchFollowupEstimatedSeconds,
  buildBatchFollowupCandidates,
  followupSubject,
  renderBatchFollowupBody,
} from "@/lib/batch-followup";
import type { KolWithLatestEmail } from "@/lib/workbench";

function kol(partial: Partial<KolWithLatestEmail> & Pick<KolWithLatestEmail, "id">): KolWithLatestEmail {
  return {
    id: partial.id,
    email: partial.email ?? "a@example.com",
    name: partial.name ?? "Alice",
    handle: "",
    primaryPlatform: "youtube",
    type: null,
    externalProfileUrl: null,
    platformHandle: null,
    source: "feishu",
    feishuRecordId: null,
    feishuOutreachAt: null,
    stage: "outreach",
    status: "active",
    ownerUserId: "u1",
    lastInboundAt: null,
    lastOutboundAt: null,
    agreedPrice: null,
    agreedDeadline: null,
    notes: null,
    replyResolved: false,
    stageOverride: false,
    ownerName: "Chloe",
    latestEmail: partial.latestEmail ?? null,
    unreadCount: 0,
    unreplied: partial.unreplied ?? false,
    awaitingReply: false,
  };
}

describe("followupSubject", () => {
  it("adds Re: prefix when missing", () => {
    expect(followupSubject("Collaboration")).toBe("Re: Collaboration");
  });

  it("keeps existing Re: prefix", () => {
    expect(followupSubject("Re: Collaboration")).toBe("Re: Collaboration");
  });

  it("falls back when subject empty", () => {
    expect(followupSubject()).toBe("Following up on collaboration");
  });
});

describe("buildBatchFollowupCandidates", () => {
  it("includes only unreplied kols up to 25", () => {
    const list = [
      ...Array.from({ length: 30 }, (_, index) =>
        kol({
          id: `k${index}`,
          unreplied: true,
          latestEmail: { subject: "Hello" } as KolWithLatestEmail["latestEmail"],
        })
      ),
      kol({ id: "replied", unreplied: false }),
    ];

    const candidates = buildBatchFollowupCandidates(list);
    expect(candidates).toHaveLength(25);
    expect(candidates.every((item) => item.subject.startsWith("Re:"))).toBe(true);
    expect(candidates.find((item) => item.kolId === "replied")).toBeUndefined();
  });
});

describe("batchFollowupEstimatedSeconds", () => {
  it("returns 0 for empty batch", () => {
    expect(batchFollowupEstimatedSeconds(0)).toBe(0);
  });

  it("returns positive estimate for non-empty batch", () => {
    expect(batchFollowupEstimatedSeconds(3)).toBeGreaterThan(0);
  });
});

describe("renderBatchFollowupBody", () => {
  it("replaces kol and sender placeholders", () => {
    expect(
      renderBatchFollowupBody(
        "Hi {{kol_name}},\n\nBest,\n{{sender_name}}",
        "Alice",
        "Chloe"
      )
    ).toBe("Hi Alice,\n\nBest,\nChloe");
  });
});
