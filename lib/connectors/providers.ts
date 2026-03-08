import { MockConnector } from "@/lib/connectors/base";
import { normalizeTitle } from "@/lib/utils";
import { AssignmentType, LmsProvider, NormalizedAssignment, RawLmsAssignment } from "@/types/lms";

function inferAssignmentType(raw: RawLmsAssignment): AssignmentType {
  if (raw.assignmentType) return raw.assignmentType;
  const haystack = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
  if (haystack.includes("quiz")) return "QUIZ";
  if (haystack.includes("exam") || haystack.includes("midterm") || haystack.includes("final")) return "EXAM";
  if (haystack.includes("project")) return "PROJECT";
  if (haystack.includes("read") || haystack.includes("reflection")) return "READING";
  if (haystack.includes("discussion")) return "DISCUSSION";
  if (haystack.includes("homework") || haystack.includes("problem set") || haystack.includes("assignment")) return "HOMEWORK";
  return "OTHER";
}

function normalizeGeneric(provider: LmsProvider, raw: RawLmsAssignment, userId: string): NormalizedAssignment {
  return {
    source: provider,
    sourceAssignmentId: raw.id,
    sourceCourseId: raw.courseId,
    userId,
    title: normalizeTitle(raw.title),
    description: raw.description,
    dueAt: new Date(raw.dueAt),
    courseName: raw.courseName ?? "Unknown Course",
    courseColor: undefined,
    url: raw.url,
    status: raw.status ?? "OPEN",
    assignmentType: inferAssignmentType(raw),
    lastSeenAt: new Date()
  };
}

export class LearningSuiteConnector extends MockConnector {
  constructor() {
    super("LEARNING_SUITE");
  }

  normalize(raw: RawLmsAssignment, userId: string): NormalizedAssignment {
    return normalizeGeneric(this.provider, raw, userId);
  }
}

export class CanvasConnector extends MockConnector {
  constructor() {
    super("CANVAS");
  }

  normalize(raw: RawLmsAssignment, userId: string): NormalizedAssignment {
    return normalizeGeneric(this.provider, raw, userId);
  }
}

export class GradescopeConnector extends MockConnector {
  constructor() {
    super("GRADESCOPE");
  }

  normalize(raw: RawLmsAssignment, userId: string): NormalizedAssignment {
    return normalizeGeneric(this.provider, raw, userId);
  }
}

export class MaxConnector extends MockConnector {
  constructor() {
    super("MAX");
  }

  normalize(raw: RawLmsAssignment, userId: string): NormalizedAssignment {
    return normalizeGeneric(this.provider, raw, userId);
  }
}
