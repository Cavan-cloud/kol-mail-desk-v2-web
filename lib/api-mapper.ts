import type { components } from "@/lib/api-client/types.gen";
import type {
  Email,
  EmailDirection,
  Kol,
  KolSource,
  KolStage,
  KolStatus,
  Platform,
  Priority,
} from "@/lib/domain";
import type { KolWithLatestEmail } from "@/lib/workbench";

type ApiKol = components["schemas"]["Kol"];
type ApiEmail = components["schemas"]["Email"];
type ApiWorkbenchKol = components["schemas"]["WorkbenchKol"];

const DEFAULT_STAGE: KolStage = "outreach";
const DEFAULT_PLATFORM: Platform = "other";
const DEFAULT_STATUS: KolStatus = "active";
const DEFAULT_SOURCE: KolSource = "feishu";
const DEFAULT_PRIORITY: Priority = "medium";

export function mapApiEmail(email: ApiEmail): Email {
  return {
    id: email.id ?? "",
    kolId: email.kolId ?? "",
    userId: email.userId ?? "",
    direction: (email.direction ?? "inbound") as EmailDirection,
    fromEmail: email.fromEmail ?? "",
    toEmails: email.toEmails ?? [],
    subject: email.subject ?? "",
    bodyText: email.bodyText ?? "",
    bodyHtml: email.bodyHtml ?? null,
    bodyZh: email.bodyZh ?? null,
    sentAt: email.sentAt ?? new Date(0).toISOString(),
    aiStageSignal: (email.aiStageSignal ?? DEFAULT_STAGE) as KolStage,
    aiPriority: (email.aiPriority ?? DEFAULT_PRIORITY) as Priority,
    aiSummary: email.aiSummary ?? "",
    aiSuggestedAction: email.aiSuggestedAction ?? "",
    isRead: email.isRead ?? false,
  };
}

export function mapApiKol(kol: ApiKol): Kol {
  return {
    id: kol.id ?? "",
    email: kol.email ?? "",
    name: kol.name ?? kol.email ?? "",
    handle: kol.handle ?? "",
    primaryPlatform: (kol.primaryPlatform ?? DEFAULT_PLATFORM) as Platform,
    type: kol.type ?? null,
    externalProfileUrl: kol.externalProfileUrl ?? null,
    platformHandle: kol.handle ?? null,
    source: (kol.source ?? DEFAULT_SOURCE) as KolSource,
    feishuRecordId: kol.feishuRecordId ?? null,
    feishuOutreachAt: kol.feishuOutreachAt ?? null,
    stage: (kol.stage ?? DEFAULT_STAGE) as KolStage,
    status: (kol.status ?? DEFAULT_STATUS) as KolStatus,
    ownerUserId: kol.ownerUserId ?? null,
    lastInboundAt: kol.lastInboundAt ?? null,
    lastOutboundAt: kol.lastOutboundAt ?? null,
    agreedPrice: kol.agreedPrice ?? null,
    brandQuote: kol.brandQuote ?? null,
    finalCooperationPrice: kol.finalCooperationPrice ?? null,
    agreedDeadline: kol.agreedDeadline ?? null,
    notes: kol.notes ?? null,
    replyResolved: kol.replyResolved ?? false,
    stageOverride: kol.stageOverride ?? false,
  };
}

export function mapWorkbenchKol(row: ApiWorkbenchKol): KolWithLatestEmail {
  const base = mapApiKol(row);
  return {
    ...base,
    ownerName: row.ownerName ?? "未分配",
    latestEmail: row.latestEmail ? mapApiEmail(row.latestEmail) : null,
    unreadCount: row.unreadCount ?? 0,
    unreplied: row.unreplied ?? false,
    awaitingReply: row.awaitingReply ?? false,
  };
}
