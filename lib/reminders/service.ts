import dayjs from "dayjs";
import { prisma } from "@/lib/db/prisma";

export async function updateReminderSettings(
  userId: string,
  payload: {
    enabled?: boolean;
    emailEnabled?: boolean;
    inAppEnabled?: boolean;
    remindHoursBefore?: number;
    snoozeUntil?: Date;
  }
) {
  return prisma.reminderSetting.upsert({
    where: { userId },
    update: payload,
    create: {
      userId,
      enabled: payload.enabled ?? true,
      emailEnabled: payload.emailEnabled ?? true,
      inAppEnabled: payload.inAppEnabled ?? true,
      remindHoursBefore: payload.remindHoursBefore ?? 24,
      snoozeUntil: payload.snoozeUntil
    }
  });
}

export async function dueSoonAssignments(userId: string) {
  const settings = await prisma.reminderSetting.findUnique({ where: { userId } });
  if (!settings?.enabled) {
    return [];
  }

  if (settings.snoozeUntil && dayjs(settings.snoozeUntil).isAfter(dayjs())) {
    return [];
  }

  const upper = dayjs().add(settings.remindHoursBefore, "hour").toDate();

  return prisma.assignment.findMany({
    where: {
      userId,
      status: "OPEN",
      dueAt: {
        gte: new Date(),
        lte: upper
      }
    },
    orderBy: { dueAt: "asc" }
  });
}
