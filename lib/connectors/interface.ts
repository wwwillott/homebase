import {
  ConnectorAuthPayload,
  LmsProvider,
  NormalizedAssignment,
  RawLmsAssignment,
  SyncCursor,
  SyncPullResponse
} from "@/types/lms";

export interface LmsConnector {
  provider: LmsProvider;
  authorize(payload: ConnectorAuthPayload): Promise<{ encryptedToken: string; externalUserId?: string }>;
  syncSince(userId: string, token: string, cursor: SyncCursor): Promise<SyncPullResponse>;
  normalize(raw: RawLmsAssignment, userId: string): NormalizedAssignment;
  healthCheck(): Promise<{ ok: boolean; message?: string }>;
}
