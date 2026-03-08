import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnector } from "@/lib/connectors";
import { connectProvider } from "@/lib/sync/service";
import { LmsProvider } from "@/types/lms";

const schema = z.object({
  userId: z.string().min(1),
  code: z.string().optional(),
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const provider = (await params).provider.toUpperCase() as LmsProvider;

  const connector = getConnector(provider);
  const auth = await connector.authorize(parsed.data);
  await connectProvider(parsed.data.userId, provider, auth.encryptedToken, auth.externalUserId);

  return NextResponse.json({ ok: true, provider });
}
