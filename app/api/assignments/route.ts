import { NextRequest, NextResponse } from "next/server";
import { getAssignmentMeta, getAssignments } from "@/lib/sync/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const viewParam = searchParams.get("view") ?? "list";
  const view = ["daily", "weekly", "monthly", "list"].includes(viewParam) ? viewParam : "list";

  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const classId = searchParams.get("classId") ?? undefined;
  const assignmentType = (searchParams.get("assignmentType") ??
    undefined) as
    | "HOMEWORK"
    | "QUIZ"
    | "EXAM"
    | "PROJECT"
    | "READING"
    | "DISCUSSION"
    | "OTHER"
    | undefined;
  const completion = (searchParams.get("completion") ?? "all") as
    | "all"
    | "incomplete"
    | "complete";
  const status = searchParams.get("status") as "OPEN" | "COMPLETED" | "OVERDUE" | null;

  const assignments = await getAssignments(userId, {
    view: view as "daily" | "weekly" | "monthly" | "list",
    start: start ? new Date(start) : undefined,
    end: end ? new Date(end) : undefined,
    classId,
    assignmentType,
    completion,
    status: status ?? undefined
  });

  const meta = await getAssignmentMeta(userId);
  return NextResponse.json({ assignments, meta });
}
