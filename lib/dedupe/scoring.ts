import { normalizeTitle, dueDateDistanceHours } from "@/lib/utils";

export interface DedupeCandidate {
  id: string;
  userId: string;
  sourceCourseId: string;
  title: string;
  dueAt: Date;
}

export interface DedupeScore {
  score: number;
  isHighConfidence: boolean;
  isPossibleDuplicate: boolean;
}

export function scoreDuplicate(a: DedupeCandidate, b: DedupeCandidate): DedupeScore {
  if (a.userId !== b.userId) {
    return { score: 0, isHighConfidence: false, isPossibleDuplicate: false };
  }

  const sameCourse = a.sourceCourseId === b.sourceCourseId;
  const dueDistance = dueDateDistanceHours(a.dueAt, b.dueAt);
  const dueScore = dueDistance <= 3 ? 1 : dueDistance <= 12 ? 0.75 : dueDistance <= 24 ? 0.5 : 0;

  const titleA = normalizeTitle(a.title);
  const titleB = normalizeTitle(b.title);
  const tokenOverlap = jaccard(titleA, titleB);

  let score = 0;
  if (sameCourse) score += 0.3;
  score += dueScore * 0.3;
  score += tokenOverlap * 0.4;

  return {
    score,
    isHighConfidence: score >= 0.85,
    isPossibleDuplicate: score >= 0.65
  };
}

function jaccard(a: string, b: string): number {
  const sa = new Set(a.split(" ").filter(Boolean));
  const sb = new Set(b.split(" ").filter(Boolean));
  if (!sa.size && !sb.size) return 1;
  let intersection = 0;
  for (const token of sa) {
    if (sb.has(token)) intersection += 1;
  }
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : intersection / union;
}
