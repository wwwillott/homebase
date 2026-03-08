import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectAppleCalendarOrIcs } from "@/lib/calendar/service";

const schema = z.object({
  userId: z.string().min(1),
  token: z.string().optional(),
  externalCalendarId: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await connectAppleCalendarOrIcs(
    parsed.data.userId,
    parsed.data.token,
    parsed.data.externalCalendarId
  );

  return NextResponse.json({ ok: true, provider: record.provider });
}
