import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConnector } from "@/lib/connectors";
import { connectProvider } from "@/lib/sync/service";
import { ConnectorAuthPayload } from "@/types/lms";

const OAUTH_STATE_COOKIE = "homebase_canvas_oauth_state";
const OAUTH_BASE_COOKIE = "homebase_canvas_oauth_base";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const savedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const baseUrl = request.cookies.get(OAUTH_BASE_COOKIE)?.value;

  if (oauthError) {
    return NextResponse.redirect(new URL(`/?canvas=oauth-error&reason=${encodeURIComponent(oauthError)}`, request.url));
  }

  if (!code || !state || !savedState || state !== savedState || !baseUrl) {
    return NextResponse.redirect(new URL("/?canvas=oauth-invalid-state", request.url));
  }

  const clientId = process.env.CANVAS_OAUTH_CLIENT_ID;
  const clientSecret = process.env.CANVAS_OAUTH_CLIENT_SECRET;
  const appBaseUrl = process.env.NEXTAUTH_URL ?? process.env.APP_BASE_URL;
  const redirectUri = process.env.CANVAS_OAUTH_REDIRECT_URI ?? `${appBaseUrl}/api/connectors/canvas/oauth/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/?canvas=oauth-misconfigured", request.url));
  }

  const tokenResponse = await fetch(`${baseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code
    }).toString(),
    cache: "no-store"
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(
      new URL(`/?canvas=oauth-token-failed&status=${tokenResponse.status}`, request.url)
    );
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenPayload.access_token) {
    return NextResponse.redirect(new URL("/?canvas=oauth-token-missing", request.url));
  }

  try {
    const connector = getConnector("CANVAS");
    const authPayload: ConnectorAuthPayload = {
      userId: session.user.id,
      token: tokenPayload.access_token,
      baseUrl
    };
    const authorization = await connector.authorize(authPayload);
    await connectProvider(
      session.user.id,
      "CANVAS",
      authorization.encryptedToken,
      authorization.externalUserId
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "connection-failed";
    return NextResponse.redirect(
      new URL(`/?canvas=oauth-connect-failed&reason=${encodeURIComponent(message)}`, request.url)
    );
  }

  const response = NextResponse.redirect(new URL("/?canvas=oauth-connected", request.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_BASE_COOKIE);
  return response;
}
