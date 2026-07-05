export const KOL_STAGES = [
  {
    id: "outreach",
    label: "触达",
    description: "已发出外联、询价或追问报价，对方尚未进入真实回复/议价。"
  },
  {
    id: "replied",
    label: "回复",
    description: "对方已回复，但尚未进入议价。"
  },
  {
    id: "negotiating",
    label: "沟通 / 议价",
    description: "对方已回复报价，或正在讨论价格、平台、内容形式。"
  },
  {
    id: "confirmed",
    label: "确认合作",
    description: "价格确定 / 已合作待签合同，合作已敲定。"
  },
  {
    id: "producing",
    label: "制作中",
    description: "进入内容制作：待脚本、脚本修改、待初稿、视频修改等。"
  },
  {
    id: "reviewing",
    label: "审稿 / 待发布",
    description: "脚本或视频已审核，等待发布。"
  },
  {
    id: "published",
    label: "发布",
    description: "内容已发布，等待回传链接或付款。"
  },
  {
    id: "paying",
    label: "付款",
    description: "已发布完成，进入或完成付款流程。"
  },
  {
    id: "reinvest",
    label: "复投",
    description: "历史合作过，适合再次触达。"
  },
  {
    id: "declined",
    label: "已拒绝",
    description: "对方拒绝或已剔除 / 放弃合作（终态）。"
  }
] as const;

export const EXTRA_STAGE_FILTERS = [
  { id: "unread", label: "未读", description: "对方来信中尚未被任何团队成员打开过的（仅 inbound）。" },
  { id: "unreplied", label: "需我回复", description: "最新一封是对方来信、尚未回复，且未手动标记「无需回复」。" }
] as const;

export const VIEW_MODES = [
  { id: "mine", label: "我的" },
  { id: "pool", label: "团队池" },
  { id: "all", label: "全部" }
] as const;

export const PLATFORM_LABELS = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  other: "其他"
} as const;

export const PRIORITY_LABELS = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级"
} as const;

export const USER_ROLE_LABELS = {
  leader: "Leader",
  full_time: "正职",
  intern: "实习生"
} as const;

export const KOL_SOURCE_LABELS = {
  gmail: "Gmail",
  feishu: "飞书",
  manual: "手动"
} as const;

export const KOL_STATUS_LABELS = {
  active: "合作中",
  unassigned: "无主",
  orphaned: "待分配",
  closed: "已成交"
} as const;

export type KolStage = (typeof KOL_STAGES)[number]["id"];
export type StageFilter = KolStage | (typeof EXTRA_STAGE_FILTERS)[number]["id"] | "all";
export type ViewMode = (typeof VIEW_MODES)[number]["id"];
export type Platform = keyof typeof PLATFORM_LABELS;
export type Priority = keyof typeof PRIORITY_LABELS;

export type UserStatus = "pending_approval" | "active" | "departed";
export type UserRole = "leader" | "full_time" | "intern";
export type KolStatus = "active" | "unassigned" | "orphaned" | "closed";
export type EmailDirection = "inbound" | "outbound";
export type KolSource = "gmail" | "feishu" | "manual";

export type TeamMember = {
  id: string;
  displayName: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  mentorUserId: string | null;
  feishuOperatorName: string | null;
};

export type Kol = {
  id: string;
  email: string;
  name: string;
  handle: string;
  primaryPlatform: Platform;
  type: string | null;
  externalProfileUrl: string | null;
  platformHandle: string | null;
  source: KolSource;
  feishuRecordId: string | null;
  feishuOutreachAt?: string | null;
  stage: KolStage;
  status: KolStatus;
  ownerUserId: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  agreedPrice: number | null;
  agreedDeadline: string | null;
  notes: string | null;
  // 手动「无需回复」覆盖：true 时该 KOL 不再算「需我回复」，即使最新邮件是 inbound。
  // 下一封新的 inbound 邮件会自动清掉该标记（后端 Gmail 同步写入路径）。
  replyResolved: boolean;
  /** 阶段已人工校准；飞书同步不会覆盖 stage。 */
  stageOverride: boolean;
};

export type Email = {
  id: string;
  kolId: string;
  userId: string;
  direction: EmailDirection;
  fromEmail: string;
  toEmails: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  bodyZh: string | null;
  sentAt: string;
  aiStageSignal: KolStage;
  aiPriority: Priority;
  aiSummary: string;
  aiSuggestedAction: string;
  isRead: boolean;
};

export type AuditAction = {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
};

export const STAGE_ORDER: Record<KolStage, number> = {
  outreach: 10,
  replied: 20,
  negotiating: 30,
  confirmed: 40,
  producing: 50,
  reviewing: 60,
  published: 70,
  paying: 80,
  reinvest: 90,
  declined: 100
};

export function stageLabel(stage: KolStage) {
  return KOL_STAGES.find((item) => item.id === stage)?.label ?? stage;
}

export function platformLabel(platform: Platform) {
  return PLATFORM_LABELS[platform];
}

export function priorityLabel(priority: Priority) {
  return PRIORITY_LABELS[priority];
}
