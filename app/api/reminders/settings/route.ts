import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateReminderSettings } from "@/lib/reminders/service";

const schema = z.object({
  userId: z.string().min(1),
  enabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  remindHoursBefore: z.number().int().min(1).max(168).optional(),
  snoozeUntil: z.string().datetime().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reminder = await updateReminderSettings(parsed.data.userId, {
    enabled: parsed.data.enabled,
    emailEnabled: parsed.data.emailEnabled,
    inAppEnabled: parsed.data.inAppEnabled,
    remindHoursBefore: parsed.data.remindHoursBefore,
    snoozeUntil: parsed.data.snoozeUntil ? new Date(parsed.data.snoozeUntil) : undefined
  });

  return NextResponse.json({ reminder });
}
