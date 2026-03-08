import { encrypt } from "@/lib/security";
import { LmsConnector } from "@/lib/connectors/interface";
import { ConnectorAuthPayload, LmsProvider, RawLmsAssignment, SyncCursor } from "@/types/lms";

export abstract class MockConnector implements LmsConnector {
  provider: LmsProvider;

  protected constructor(provider: LmsProvider) {
    this.provider = provider;
  }

  async authorize(payload: ConnectorAuthPayload): Promise<{ encryptedToken: string; externalUserId?: string }> {
    const seed = payload.token ?? payload.code ?? payload.username ?? "demo-token";
    return {
      encryptedToken: encrypt(`${this.provider}:${seed}`),
      externalUserId: payload.username
    };
  }

  async syncSince(_userId: string, _token: string, _cursor: SyncCursor) {
    const now = new Date();
    const assignments: RawLmsAssignment[] = [
      {
        id: `${this.provider}-A1`,
        courseId: `${this.provider}-C1`,
        courseName: `${this.provider} Intro`,
        title: "Reading Reflection",
        description: "Submit one paragraph reflection",
        dueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        url: "https://example.edu/assignment/A1"
      },
      {
        id: `${this.provider}-A2`,
        courseId: `${this.provider}-C1`,
        courseName: `${this.provider} Intro`,
        title: "Quiz 3",
        description: "Timed quiz",
        dueAt: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
        url: "https://example.edu/assignment/A2"
      }
    ];
    return {
      assignments,
      nextCursor: now.toISOString(),
      checksum: `${this.provider}-${assignments.length}-${now.getUTCDate()}`
    };
  }

  abstract normalize(raw: RawLmsAssignment, userId: string): ReturnType<LmsConnector["normalize"]>;

  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    return { ok: true };
  }
}
