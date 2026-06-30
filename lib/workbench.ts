import { type Email, type Kol } from "@/lib/domain";

export type KolWithLatestEmail = Kol & {
  ownerName: string;
  latestEmail: Email | null;
  unreadCount: number;
  // 需我回复：该达人最新一封邮件是对方发来的（inbound），我们尚未回复。
  unreplied: boolean;
  // 等待对方：最新一封是我们发出的（outbound），在等对方回复。
  awaitingReply: boolean;
};

// Stalled-thread heuristic used for the team pool (someone else's KOL whose
// last inbound is 3+ days unanswered). Kept timestamp-based on purpose.
export function isUnreplied(kol: Kol, now = new Date()) {
  if (!kol.lastInboundAt) return false;
  if (kol.lastOutboundAt && Date.parse(kol.lastOutboundAt) > Date.parse(kol.lastInboundAt)) {
    return false;
  }
  const days = (now.getTime() - Date.parse(kol.lastInboundAt)) / 86_400_000;
  return days >= 3;
}

// 需我回复：最新一封邮件是对方发来的（inbound）。如果我们已回复，最新一封会是
// outbound，就不再算「需我回复」。这是工作台优先级的核心信号——只对真正等我处理
// 的来信负责，不把自己发出的外联当成高优先级。
// `replyResolved` 是手动「无需回复」覆盖：用户判断这条会话已结束（比如对方只是
// 道谢）即可在 UI 标记，从此该 KOL 不再算「需我回复」；下次有新的 inbound 自动
// 清掉标记，重新计入。
export function needsMyReply(latestEmail: Email | null, replyResolved = false): boolean {
  if (replyResolved) return false;
  return latestEmail?.direction === "inbound";
}

// 等待对方：最新一封是我们发出的外联/跟进，正在等对方回复（与「需我回复」互斥）。
export function awaitingTheirReply(latestEmail: Email | null): boolean {
  return latestEmail?.direction === "outbound";
}

// 高优先级（需我处理）：最新一封是对方来信且 AI 判为 high。outbound 永远不算。
export function isHighPriorityInbound(latestEmail: Email | null): boolean {
  return latestEmail?.direction === "inbound" && latestEmail.aiPriority === "high";
}
