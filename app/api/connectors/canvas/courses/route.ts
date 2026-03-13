import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security";

interface CanvasCourse {
  id: number;
  name: string;
}

function normalizeBaseUrl(rawBaseUrl?: string | null): string | null {
  if (!rawBaseUrl) return null;
  const trimmed = rawBaseUrl.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function parseCanvasTokenPackage(token: string): { accessToken: string; baseUrl: string } {
  try {
    const parsed = JSON.parse(token) as { accessToken?: string; baseUrl?: string };
    const accessToken = parsed.accessToken?.trim();
    const baseUrl = normalizeBaseUrl(parsed.baseUrl);
    if (!accessToken || !baseUrl) {
      throw new Error("Invalid Canvas token package");
    }
    return { accessToken, baseUrl };
  } catch {
    const baseUrl = normalizeBaseUrl(process.env.CANVAS_BASE_URL);
    if (!baseUrl) {
      throw new Error("Canvas base URL missing");
    }
    return { accessToken: token, baseUrl };
  }
}

async function fetchAllCanvasPages<T>(url: string, headers: HeadersInit): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Canvas API request failed (${response.status})`);
    }
    const page = (await response.json()) as T[];
    items.push(...page);
    nextUrl = parseCanvasNextLink(response.headers.get("link"));
  }

  return items;
}

function parseCanvasNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const links = linkHeader.split(",");
  for (const link of links) {
    const [urlPart, relPart] = link.split(";");
    if (!urlPart || !relPart) continue;
    if (!relPart.includes('rel="next"')) continue;
    const match = urlPart.match(/<([^>]+)>/);
    if (!match) continue;
    return match[1];
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connector = await prisma.connectorAccount.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: "CANVAS" } }
  });
  if (!connector?.encryptedToken) {
    return NextResponse.json({ error: "Canvas not connected" }, { status: 400 });
  }

  const token = decrypt(connector.encryptedToken);
  const { accessToken, baseUrl } = parseCanvasTokenPackage(token);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const courses = await fetchAllCanvasPages<CanvasCourse>(
    `${baseUrl}/api/v1/courses?enrollment_state=active&state[]=available&per_page=100`,
    headers
  );

  return NextResponse.json({
    courses: courses.map((course) => ({ id: String(course.id), name: course.name }))
  });
}
