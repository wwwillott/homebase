import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectAppleCalendarOrIcs } from "@/lib/calendar/service";

const schema = z.object({
  token: z.string().optional(),
  externalCalendarId: z.string().optional()
});

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

  const record = await connectAppleCalendarOrIcs(
    session.user.id,
    parsed.data.token,
    parsed.data.externalCalendarId
  );

  return NextResponse.json({ ok: true, provider: record.provider });
}
