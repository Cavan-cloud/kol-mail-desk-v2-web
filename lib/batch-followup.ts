import type { KolWithLatestEmail } from "@/lib/workbench";

export type BatchFollowupCandidate = {
  kolId: string;
  name: string;
  to: string;
  subject: string;
};

const BATCH_FOLLOWUP_LIMIT = 25;

/** Prefix Re: when the latest subject is not already a reply line. */
export function followupSubject(subject?: string | null) {
  if (!subject?.trim()) return "Following up on collaboration";
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

/** Unreplied KOLs in the current list, capped for Gmail rate limits. */
export function buildBatchFollowupCandidates(
  list: KolWithLatestEmail[]
): BatchFollowupCandidate[] {
  return list
    .filter((kol) => kol.unreplied)
    .slice(0, BATCH_FOLLOWUP_LIMIT)
    .map((kol) => ({
      kolId: kol.id,
      name: kol.name,
      to: kol.email,
      subject: followupSubject(kol.latestEmail?.subject),
    }));
}

export function batchFollowupEstimatedSeconds(count: number) {
  if (count <= 0) return 0;
  // Backend serializes sends with ~1.2s gap between items.
  return Math.ceil((count - 1) * 1.2 + count);
}

export const BATCH_FOLLOWUP_BODY_TEMPLATE = `Hi {{kol_name}},

Just following up on my previous email. Please let me know if you are interested or if there is a better contact for this collaboration.

Best,
{{sender_name}}`;

/** Render one follow-up body for a KOL from the shared template. */
export function renderBatchFollowupBody(
  template: string,
  kolName: string,
  senderName: string
): string {
  const body = template.trim() || BATCH_FOLLOWUP_BODY_TEMPLATE;
  return body
    .replaceAll("{{kol_name}}", kolName)
    .replaceAll("{{creator_name}}", kolName)
    .replaceAll("{{sender_name}}", senderName.trim() || "Chloe");
}
