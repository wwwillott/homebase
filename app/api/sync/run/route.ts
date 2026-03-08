import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runSync } from "@/lib/sync/service";
import { LmsProvider } from "@/types/lms";

const schema = z.object({
  userId: z.string().min(1),
  providers: z.array(z.enum(["LEARNING_SUITE", "CANVAS", "GRADESCOPE", "MAX"])).optional()
});

const DEFAULT_PROVIDERS: LmsProvider[] = ["LEARNING_SUITE", "CANVAS", "GRADESCOPE", "MAX"];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const results = await runSync(parsed.data.userId, parsed.data.providers ?? DEFAULT_PROVIDERS);
  return NextResponse.json({ results });
}
