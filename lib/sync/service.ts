import { prisma } from "@/lib/db/prisma";
import { getConnector } from "@/lib/connectors";
import { scoreDuplicate } from "@/lib/dedupe/scoring";
import { decrypt } from "@/lib/security";
import { summarizeAssignmentDescription } from "@/lib/assignments/description";
import {
  getConnectorState,
  listAssignmentFilterMeta,
  listAssignmentsForRange,
  updateConnectorState,
  upsertAssignments
} from "@/lib/sync/repository";
import { startAndEndForView } from "@/lib/utils";
import { AggregatedAssignment, LmsProvider, SyncResult } from "@/types/lms";

export async function connectProvider(userId: string, provider: LmsProvider, encryptedToken: string, externalUserId?: string) {
  return prisma.connectorAccount.upsert({
    where: { userId_provider: { userId, provider } },
    update: { encryptedToken, externalUserId },
    create: { userId, provider, encryptedToken, externalUserId }
  });
}

export async function runSync(userId: string, providers: LmsProvider[]): Promise<SyncResult[]> {
  const syncResults: SyncResult[] = [];

  for (const provider of providers) {
    const state = await getConnectorState(userId, provider);
    if (!state?.encryptedToken) {
      continue;
    }

    const connector = getConnector(provider);
    const token = decrypt(state.encryptedToken);
    const pull = await connector.syncSince(userId, token, { cursor: state.cursor ?? undefined });
    const normalized = pull.assignments.map((raw) => connector.normalize(raw, userId));

    const ids = await upsertAssignments(normalized);
    const dedupeCandidates = await evaluateDuplicates(userId, ids);

    await updateConnectorState(userId, provider, {
      cursor: pull.nextCursor,
      checksum: pull.checksum
    });

    syncResults.push({
      provider,
      pulled: pull.assignments.length,
      upserted: ids.length,
      dedupeCandidates,
      cursor: pull.nextCursor
    });
  }

  return syncResults;
}

async function evaluateDuplicates(userId: string, assignmentIds: string[]): Promise<number> {
  if (assignmentIds.length === 0) {
    return 0;
  }

  const records = await prisma.assignment.findMany({
    where: { id: { in: assignmentIds }, userId }
  });

  const peers = await prisma.assignment.findMany({
    where: {
      userId,
      id: { notIn: assignmentIds }
    }
  });

  let duplicateCount = 0;

  for (const current of records) {
    for (const peer of peers) {
      const score = scoreDuplicate(
        {
          id: current.id,
          userId: current.userId,
          sourceCourseId: current.sourceCourseId,
          title: current.title,
          dueAt: current.dueAt
        },
        {
          id: peer.id,
          userId: peer.userId,
          sourceCourseId: peer.sourceCourseId,
          title: peer.title,
          dueAt: peer.dueAt
        }
      );

      if (!score.isPossibleDuplicate) {
        continue;
      }

      duplicateCount += 1;
      const canonical = current.dueAt <= peer.dueAt ? current : peer;
      const member = current.dueAt <= peer.dueAt ? peer : current;

      const group = await prisma.duplicateGroup.create({
        data: {
          userId,
          canonicalAssignmentId: canonical.id,
          dedupeConfidence: score.score,
          needsReview: !score.isHighConfidence,
          assignments: {
            connect: [{ id: canonical.id }, { id: member.id }]
          }
        }
      });

      await prisma.assignment.updateMany({
        where: { id: { in: [canonical.id, member.id] } },
        data: { dedupeGroupId: group.id }
      });
    }
  }

  return duplicateCount;
}

export async function getAssignments(
  userId: string,
  params: {
    view: "daily" | "weekly" | "monthly" | "list";
    start?: Date;
    end?: Date;
    classId?: string;
    assignmentType?: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "READING" | "DISCUSSION" | "OTHER";
    completion?: "all" | "incomplete" | "complete";
    status?: "OPEN" | "COMPLETED" | "OVERDUE";
  }
): Promise<AggregatedAssignment[]> {
  const range =
    params.start && params.end
      ? { start: params.start, end: params.end }
      : startAndEndForView(params.view);

  const assignments = await listAssignmentsForRange(userId, {
    start: range.start,
    end: range.end,
    classId: params.classId,
    assignmentType: params.assignmentType,
    completion: params.completion,
    status: params.status
  });

  return assignments.map((assignment) => ({
    canonicalAssignmentId: assignment.id,
    memberAssignmentIds: assignment.dedupeGroupId ? [assignment.id] : [assignment.id],
    dedupeConfidence: assignment.dedupeGroupId ? 0.75 : 1,
    mergedFields: {
      source: assignment.source,
      title: assignment.title,
      // Clean legacy HTML-rich descriptions that may exist from earlier sync versions.
      description: summarizeAssignmentDescription(assignment.description),
      dueAt: assignment.dueAt,
      courseName: assignment.courseName,
      courseColor: assignment.courseColor ?? undefined,
      status: assignment.status,
      assignmentType: assignment.assignmentType,
      url: assignment.url ?? undefined
    },
    needsReview: Boolean(assignment.dedupeGroupId)
  }));
}

export async function getAssignmentMeta(userId: string) {
  return listAssignmentFilterMeta(userId);
}

export async function setAssignmentCompletion(
  userId: string,
  assignmentId: string,
  completed: boolean
) {
  const existing = await prisma.assignment.findFirst({
    where: { id: assignmentId, userId }
  });
  if (!existing) {
    throw new Error("Assignment not found");
  }

  return prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: completed ? "COMPLETED" : "OPEN" }
  });
}

export async function resolveDuplicateGroup(userId: string, groupId: string, keepAssignmentId: string) {
  const group = await prisma.duplicateGroup.findUnique({
    where: { id: groupId },
    include: { assignments: true }
  });

  if (!group || group.userId !== userId) {
    throw new Error("Duplicate group not found");
  }

  const keep = group.assignments.find((a) => a.id === keepAssignmentId);
  if (!keep) {
    throw new Error("Assignment not found in group");
  }

  await prisma.duplicateGroup.update({
    where: { id: groupId },
    data: {
      canonicalAssignmentId: keep.id,
      needsReview: false,
      resolvedAt: new Date()
    }
  });

  return { ok: true };
}
