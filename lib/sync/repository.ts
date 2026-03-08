import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { stableHash } from "@/lib/utils";
import { LmsProvider, NormalizedAssignment } from "@/types/lms";

export async function upsertAssignments(assignments: NormalizedAssignment[]) {
  const results = [] as string[];

  for (const item of assignments) {
    const hash = stableHash([
      item.source,
      item.sourceAssignmentId,
      item.sourceCourseId,
      item.title,
      item.dueAt.toISOString(),
      item.description ?? "",
      item.assignmentType
    ].join("|"));

    const assignment = await prisma.assignment.upsert({
      where: {
        userId_source_sourceAssignmentId: {
          userId: item.userId,
          source: item.source,
          sourceAssignmentId: item.sourceAssignmentId
        }
      },
      update: {
        sourceCourseId: item.sourceCourseId,
        title: item.title,
        description: item.description,
        dueAt: item.dueAt,
        courseName: item.courseName,
        courseColor: item.courseColor,
        url: item.url,
        status: item.status,
        assignmentType: item.assignmentType,
        lastSeenAt: item.lastSeenAt,
        hash
      },
      create: {
        userId: item.userId,
        source: item.source,
        sourceAssignmentId: item.sourceAssignmentId,
        sourceCourseId: item.sourceCourseId,
        title: item.title,
        description: item.description,
        dueAt: item.dueAt,
        courseName: item.courseName,
        courseColor: item.courseColor,
        url: item.url,
        status: item.status,
        assignmentType: item.assignmentType,
        lastSeenAt: item.lastSeenAt,
        hash
      }
    });

    results.push(assignment.id);
  }

  return results;
}

export async function updateConnectorState(
  userId: string,
  provider: LmsProvider,
  values: { cursor?: string; checksum?: string }
) {
  await prisma.connectorAccount.update({
    where: { userId_provider: { userId, provider } },
    data: {
      cursor: values.cursor,
      checksum: values.checksum,
      lastSyncAt: new Date()
    }
  });
}

export async function getConnectorState(userId: string, provider: LmsProvider) {
  return prisma.connectorAccount.findUnique({
    where: { userId_provider: { userId, provider } }
  });
}

export async function listAssignmentsForRange(
  userId: string,
  opts: {
    start: Date;
    end: Date;
    classId?: string;
    assignmentType?: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "READING" | "DISCUSSION" | "OTHER";
    status?: "OPEN" | "COMPLETED" | "OVERDUE";
    completion?: "all" | "incomplete" | "complete";
  }
) {
  const where: Prisma.AssignmentWhereInput = {
    userId,
    dueAt: { gte: opts.start, lte: opts.end }
  };

  if (opts.classId) where.sourceCourseId = opts.classId;
  if (opts.assignmentType) where.assignmentType = opts.assignmentType;

  if (opts.completion === "complete") {
    where.status = "COMPLETED";
  } else if (opts.completion === "incomplete") {
    where.status = { in: ["OPEN", "OVERDUE"] };
  }

  if (opts.status) where.status = opts.status;

  return prisma.assignment.findMany({
    where,
    orderBy: [{ dueAt: "asc" }, { courseName: "asc" }]
  });
}

export async function listAssignmentFilterMeta(userId: string) {
  const rows = await prisma.assignment.findMany({
    where: { userId },
    select: { sourceCourseId: true, courseName: true, assignmentType: true },
    orderBy: [{ courseName: "asc" }]
  });

  const classes = Array.from(
    new Map(rows.map((r) => [r.sourceCourseId, { id: r.sourceCourseId, name: r.courseName }])).values()
  );
  const assignmentTypes = Array.from(new Set(rows.map((r) => r.assignmentType)));
  return { classes, assignmentTypes };
}
