import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashToken } from "@/lib/session";

// Tokens can only be managed from a browser login, never with another API token.

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const tokens = await db.apiToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true },
  });
  return NextResponse.json(tokens);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 60) || "MCP token";

  const token = `blg_${randomBytes(32).toString("hex")}`;
  const row = await db.apiToken.create({
    data: { name, tokenHash: hashToken(token), userId: user.id },
    select: { id: true, name: true, createdAt: true },
  });
  // The plain token is returned only this once.
  return NextResponse.json({ ...row, token }, { status: 201 });
}
