import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getConnector } from "@/lib/connectors";
import { connectProvider } from "@/lib/sync/service";
import { ConnectorAuthPayload, LmsProvider } from "@/types/lms";

const schema = z.object({
  code: z.string().optional(),
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const provider = (await params).provider.toUpperCase() as LmsProvider;

  const connector = getConnector(provider);
  const authPayload: ConnectorAuthPayload = {
    userId: session.user.id,
    code: parsed.data.code,
    token: parsed.data.token,
    username: parsed.data.username,
    password: parsed.data.password
  };
  const authorization = await connector.authorize(authPayload);
  await connectProvider(
    session.user.id,
    provider,
    authorization.encryptedToken,
    authorization.externalUserId
  );

  return NextResponse.json({ ok: true, provider });
}
