import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setAssignmentCompletion } from "@/lib/sync/service";

const schema = z.object({
  userId: z.string().min(1),
  completed: z.boolean()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await setAssignmentCompletion(
      parsed.data.userId,
      (await params).assignmentId,
      parsed.data.completed
    );
    return NextResponse.json({ assignment: updated });
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}
