import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { runSync } from "@/lib/sync/service";
import { LmsProvider } from "@/types/lms";

const schema = z.object({
  providers: z.array(z.enum(["LEARNING_SUITE", "CANVAS", "GRADESCOPE", "MAX"])).optional()
});

const DEFAULT_PROVIDERS: LmsProvider[] = ["LEARNING_SUITE", "CANVAS", "GRADESCOPE", "MAX"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const results = await runSync(session.user.id, parsed.data.providers ?? DEFAULT_PROVIDERS);
  return NextResponse.json({ results });
}
