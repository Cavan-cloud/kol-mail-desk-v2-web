import { unwrap, type ApiClient } from "./http";
import type { components } from "./types.gen";

export type TeamMember = components["schemas"]["TeamMember"];
export type TeamMembersResponse =
  components["schemas"]["TeamMembersResponse"];
export type Profile = components["schemas"]["Profile"];
export type TeamProfileUpdateRequest =
  components["schemas"]["TeamProfileUpdateRequest"];

export interface DepartTeamMemberResult {
  orphanedCount?: number;
}

export function buildTeamApi(client: ApiClient) {
  return {
    /** GET /api/v1/team/members — 团队成员 + 团队池。 */
    listMembers(): Promise<TeamMembersResponse> {
      return unwrap(client.GET("/api/v1/team/members", {}));
    },
    /** PATCH /api/v1/team/profile — 编辑个人资料。 */
    updateProfile(body: TeamProfileUpdateRequest): Promise<Profile> {
      return unwrap(client.PATCH("/api/v1/team/profile", { body }));
    },
    /** POST /api/v1/team/depart/{userId} — Leader 标记成员离职。 */
    depart(userId: string): Promise<DepartTeamMemberResult> {
      return unwrap(
        client.POST("/api/v1/team/depart/{userId}", {
          params: { path: { userId } },
        })
      );
    },
  };
}

export type TeamApi = ReturnType<typeof buildTeamApi>;
