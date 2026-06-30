import type { UserRole } from "@/lib/domain";

export function normalizeUserRole(value: string | null | undefined): UserRole {
  if (value === "leader" || value === "full_time" || value === "intern") return value;
  return "full_time";
}

export type LeaderGuardProfile = {
  role?: string | null;
  status?: string | null;
} | null;

export class LeaderForbiddenError extends Error {
  constructor(message = "仅 Leader 可执行该操作") {
    super(message);
    this.name = "LeaderForbiddenError";
  }
}

export function isLeader(profile: LeaderGuardProfile): boolean {
  return normalizeUserRole(profile?.role) === "leader" && profile?.status !== "departed";
}

export function assertLeader(profile: LeaderGuardProfile): void {
  if (!isLeader(profile)) {
    throw new LeaderForbiddenError();
  }
}
