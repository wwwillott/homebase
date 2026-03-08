import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const OAUTH_STATE_COOKIE = "homebase_canvas_oauth_state";
const OAUTH_BASE_COOKIE = "homebase_canvas_oauth_base";

function normalizeBaseUrl(rawBaseUrl?: string | null): string | null {
  if (!rawBaseUrl) return null;
  const trimmed = rawBaseUrl.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const clientId = process.env.CANVAS_OAUTH_CLIENT_ID;
  const appBaseUrl = process.env.NEXTAUTH_URL ?? process.env.APP_BASE_URL;
  const redirectUri = process.env.CANVAS_OAUTH_REDIRECT_URI ?? `${appBaseUrl}/api/connectors/canvas/oauth/callback`;
  const requestedBase = request.nextUrl.searchParams.get("baseUrl");
  const baseUrl = normalizeBaseUrl(requestedBase) ?? normalizeBaseUrl(process.env.CANVAS_BASE_URL);

  if (!clientId || !appBaseUrl || !baseUrl) {
    return NextResponse.redirect(new URL("/?canvas=oauth-misconfigured", request.url));
  }

  const state = crypto.randomBytes(24).toString("hex");
  const authorizeUrl = new URL(`${baseUrl}/login/oauth2/auth`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 10
  });
  response.cookies.set(OAUTH_BASE_COOKIE, baseUrl, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
