export type LmsProvider = "LEARNING_SUITE" | "CANVAS" | "GRADESCOPE" | "MAX";

export type AssignmentStatus = "OPEN" | "COMPLETED" | "OVERDUE";
export type AssignmentType =
  | "HOMEWORK"
  | "QUIZ"
  | "EXAM"
  | "PROJECT"
  | "READING"
  | "DISCUSSION"
  | "OTHER";

export interface RawLmsAssignment {
  id: string;
  courseId: string;
  courseName?: string;
  title: string;
  description?: string;
  dueAt: string;
  url?: string;
  status?: AssignmentStatus;
  assignmentType?: AssignmentType;
}

export interface NormalizedAssignment {
  source: LmsProvider;
  sourceAssignmentId: string;
  sourceCourseId: string;
  userId: string;
  title: string;
  description?: string;
  dueAt: Date;
  courseName: string;
  courseColor?: string;
  url?: string;
  status: AssignmentStatus;
  assignmentType: AssignmentType;
  lastSeenAt: Date;
}

export interface SyncResult {
  provider: LmsProvider;
  pulled: number;
  upserted: number;
  dedupeCandidates: number;
  cursor?: string;
}

export interface AggregatedAssignment {
  canonicalAssignmentId: string;
  memberAssignmentIds: string[];
  dedupeConfidence: number;
  mergedFields: {
    title: string;
    description?: string;
    dueAt: Date;
    courseName: string;
    courseColor?: string;
    status: AssignmentStatus;
    assignmentType: AssignmentType;
    url?: string;
  };
  needsReview: boolean;
}

export interface ConnectorAuthPayload {
  userId: string;
  code?: string;
  token?: string;
  username?: string;
  password?: string;
}

export interface SyncCursor {
  cursor?: string;
}

export interface SyncPullResponse {
  assignments: RawLmsAssignment[];
  nextCursor?: string;
  checksum?: string;
}
