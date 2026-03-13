import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.connectorAccount.findMany({
    where: { userId: session.user.id },
    select: { provider: true, externalUserId: true }
  });

  const connectedProviders = Array.from(new Set(accounts.map((account) => account.provider)));
  return NextResponse.json({
    connectedProviders,
    hasConnections: connectedProviders.length > 0
  });
}
