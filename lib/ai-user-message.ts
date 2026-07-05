/** User-visible copy when AI is unavailable (no key, quota, upstream failure). */
export const AI_QUOTA_EXCEEDED_MESSAGE = "当前大模型用量已达上限";

export function aiUnavailableUserMessage(): string {
  return AI_QUOTA_EXCEEDED_MESSAGE;
}
