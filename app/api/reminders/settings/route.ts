import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { updateReminderSettings } from "@/lib/reminders/service";

const schema = z.object({
  enabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  remindHoursBefore: z.number().int().min(1).max(168).optional(),
  snoozeUntil: z.string().datetime().optional()
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

  const reminder = await updateReminderSettings(session.user.id, {
    enabled: parsed.data.enabled,
    emailEnabled: parsed.data.emailEnabled,
    inAppEnabled: parsed.data.inAppEnabled,
    remindHoursBefore: parsed.data.remindHoursBefore,
    snoozeUntil: parsed.data.snoozeUntil ? new Date(parsed.data.snoozeUntil) : undefined
  });

  return NextResponse.json({ reminder });
}
