import { MockConnector } from "@/lib/connectors/base";
import { encrypt } from "@/lib/security";
import { normalizeTitle } from "@/lib/utils";
import {
  AssignmentType,
  ConnectorAuthPayload,
  LmsProvider,
  NormalizedAssignment,
  RawLmsAssignment,
  SyncCursor
} from "@/types/lms";

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

function inferAssignmentTypeFromCanvas(
  title: string,
  description: string | null | undefined,
  submissionTypes: string[] | undefined
): AssignmentType {
  const submissionSet = new Set(submissionTypes ?? []);
  if (submissionSet.has("discussion_topic")) return "DISCUSSION";
  if (submissionSet.has("online_quiz")) return "QUIZ";
  if (submissionSet.has("none")) return "READING";

  const haystack = `${title} ${description ?? ""}`.toLowerCase();
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

  async authorize(payload: ConnectorAuthPayload): Promise<{ encryptedToken: string; externalUserId?: string }> {
    const accessToken = payload.token ?? payload.code;
    if (!accessToken) {
      throw new Error("Canvas token is required");
    }

    const baseUrl = normalizeCanvasBaseUrl(payload.baseUrl ?? process.env.CANVAS_BASE_URL);
    if (!baseUrl) {
      throw new Error("Canvas base URL is required");
    }

    // Validate credentials early so users get fast feedback on invalid tokens/domains.
    const profileResponse = await fetch(`${baseUrl}/api/v1/users/self`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });
    if (!profileResponse.ok) {
      throw new Error("Canvas authentication failed");
    }

    const profile = (await profileResponse.json()) as { id?: number | string };
    return {
      encryptedToken: encrypt(JSON.stringify({ accessToken, baseUrl })),
      externalUserId: profile.id ? String(profile.id) : undefined
    };
  }

  async syncSince(_userId: string, token: string, cursor: SyncCursor) {
    const { accessToken, baseUrl } = parseCanvasTokenPackage(token);
    const headers = { Authorization: `Bearer ${accessToken}` };
    const courses = await fetchAllCanvasPages<CanvasCourse>(
      `${baseUrl}/api/v1/courses?enrollment_state=active&state[]=available&per_page=100`,
      headers
    );

    const assignments: RawLmsAssignment[] = [];
    const since = cursor.cursor ? new Date(cursor.cursor) : null;

    for (const course of courses) {
      const courseAssignments = await fetchAllCanvasPages<CanvasAssignment>(
        `${baseUrl}/api/v1/courses/${course.id}/assignments?per_page=100&include[]=description`,
        headers
      );

      for (const assignment of courseAssignments) {
        if (!assignment.due_at) {
          continue;
        }

        // Basic incremental behavior using Canvas assignment updated timestamp when available.
        if (since && assignment.updated_at && new Date(assignment.updated_at) <= since) {
          continue;
        }

        assignments.push({
          id: String(assignment.id),
          courseId: String(course.id),
          courseName: course.name,
          title: assignment.name,
          description: assignment.description ?? undefined,
          dueAt: assignment.due_at,
          url: assignment.html_url ?? `${baseUrl}/courses/${course.id}/assignments/${assignment.id}`,
          status: "OPEN",
          assignmentType: inferAssignmentTypeFromCanvas(
            assignment.name,
            assignment.description,
            assignment.submission_types
          )
        });
      }
    }

    const now = new Date().toISOString();
    return {
      assignments,
      nextCursor: now,
      checksum: `CANVAS-${assignments.length}-${now}`
    };
  }

  normalize(raw: RawLmsAssignment, userId: string): NormalizedAssignment {
    return normalizeGeneric(this.provider, raw, userId);
  }

  async healthCheck() {
    return {
      ok: Boolean(process.env.CANVAS_BASE_URL),
      message: process.env.CANVAS_BASE_URL
        ? undefined
        : "Set CANVAS_BASE_URL or provide baseUrl at connector connect time."
    };
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

interface CanvasCourse {
  id: number;
  name: string;
}

interface CanvasAssignment {
  id: number;
  name: string;
  description?: string | null;
  due_at?: string | null;
  html_url?: string | null;
  updated_at?: string | null;
  submission_types?: string[];
}

function normalizeCanvasBaseUrl(rawBaseUrl?: string): string | null {
  if (!rawBaseUrl) return null;
  const trimmed = rawBaseUrl.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function parseCanvasTokenPackage(token: string): { accessToken: string; baseUrl: string } {
  try {
    const parsed = JSON.parse(token) as { accessToken?: string; baseUrl?: string };
    const accessToken = parsed.accessToken?.trim();
    const baseUrl = normalizeCanvasBaseUrl(parsed.baseUrl);
    if (!accessToken || !baseUrl) {
      throw new Error("Invalid Canvas token package");
    }
    return { accessToken, baseUrl };
  } catch {
    // Backward-compatible fallback for older plain-token records.
    const baseUrl = normalizeCanvasBaseUrl(process.env.CANVAS_BASE_URL);
    if (!baseUrl) {
      throw new Error("Canvas token package is invalid and CANVAS_BASE_URL is not set");
    }
    return { accessToken: token, baseUrl };
  }
}

async function fetchAllCanvasPages<T>(url: string, headers: HeadersInit): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Canvas API request failed (${response.status})`);
    }
    const page = (await response.json()) as T[];
    items.push(...page);
    nextUrl = parseCanvasNextLink(response.headers.get("link"));
  }

  return items;
}

function parseCanvasNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const links = linkHeader.split(",");
  for (const link of links) {
    const [urlPart, relPart] = link.split(";");
    if (!urlPart || !relPart) continue;
    if (!relPart.includes('rel="next"')) continue;
    const match = urlPart.match(/<([^>]+)>/);
    if (!match) continue;
    return match[1];
  }
  return null;
}
