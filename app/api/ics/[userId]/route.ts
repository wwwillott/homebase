import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { generateIcs } from "@/lib/calendar/service";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { userId, status: "OPEN" },
    orderBy: { dueAt: "asc" },
    take: 500
  });

  const ics = generateIcs(
    assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description ?? undefined,
      dueAt: assignment.dueAt
    }))
  );
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8"
    }
  });
}
