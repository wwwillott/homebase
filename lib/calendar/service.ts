import { prisma } from "@/lib/db/prisma";
import { encrypt } from "@/lib/security";

export async function connectGoogleCalendar(userId: string, token: string, externalCalendarId?: string) {
  return prisma.calendarConnection.upsert({
    where: { userId_provider: { userId, provider: "GOOGLE" } },
    update: {
      encryptedToken: encrypt(token),
      externalCalendarId,
      syncEnabled: true
    },
    create: {
      userId,
      provider: "GOOGLE",
      encryptedToken: encrypt(token),
      externalCalendarId,
      syncEnabled: true
    }
  });
}

export async function connectAppleCalendarOrIcs(userId: string, token?: string, externalCalendarId?: string) {
  const provider = token ? "APPLE" : "ICS";
  return prisma.calendarConnection.upsert({
    where: { userId_provider: { userId, provider } },
    update: {
      encryptedToken: token ? encrypt(token) : undefined,
      externalCalendarId,
      syncEnabled: true
    },
    create: {
      userId,
      provider,
      encryptedToken: token ? encrypt(token) : undefined,
      externalCalendarId,
      syncEnabled: true
    }
  });
}

export function buildStableExternalEventId(canonicalAssignmentId: string): string {
  return `homebase-${canonicalAssignmentId}`;
}

export function generateIcs(assignments: Array<{ id: string; title: string; description?: string; dueAt: Date }>) {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HomeBase//Assignment Sync//EN"
  ];

  const events = assignments.map((item) => {
    const due = item.dueAt.toISOString().replace(/[-:]/g, "").replace(".000", "");
    return [
      "BEGIN:VEVENT",
      `UID:${buildStableExternalEventId(item.id)}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(".000", "")}`,
      `DTSTART:${due}`,
      `DTEND:${due}`,
      `SUMMARY:${escapeText(item.title)}`,
      `DESCRIPTION:${escapeText(item.description ?? "")}`,
      "END:VEVENT"
    ].join("\n");
  });

  return [...header, ...events, "END:VCALENDAR"].join("\n");
}

function escapeText(value: string): string {
  return value.replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}
