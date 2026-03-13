import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAssignmentMeta, getAssignments } from "@/lib/sync/service";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const viewParam = searchParams.get("view") ?? "list";
  const view = ["daily", "weekly", "monthly", "list", "calendar"].includes(viewParam)
    ? viewParam
    : "list";

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

  const assignments = await getAssignments(session.user.id, {
    view: view as "daily" | "weekly" | "monthly" | "list" | "calendar",
    start: start ? new Date(start) : undefined,
    end: end ? new Date(end) : undefined,
    classId,
    assignmentType,
    completion,
    status: status ?? undefined
  });

  const meta = await getAssignmentMeta(session.user.id);
  return NextResponse.json({ assignments, meta });
}
