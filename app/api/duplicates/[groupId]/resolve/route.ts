import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveDuplicateGroup } from "@/lib/sync/service";

const schema = z.object({
  keepAssignmentId: z.string().min(1)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

  const result = await resolveDuplicateGroup(
    session.user.id,
    (await params).groupId,
    parsed.data.keepAssignmentId
  );
  return NextResponse.json(result);
}
