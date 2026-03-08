import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { setAssignmentCompletion } from "@/lib/sync/service";

const schema = z.object({
  completed: z.boolean()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await setAssignmentCompletion(
      session.user.id,
      (await params).assignmentId,
      parsed.data.completed
    );
    return NextResponse.json({ assignment: updated });
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}
