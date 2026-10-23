import "server-only";
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "./db";

const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE = "session";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

const userSelect = { id: true, name: true, email: true } as const;

// The user from the browser login cookie. Used for pages and for managing API tokens.
export const getSessionUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return await db.user.findUnique({
      where: { id: payload.userId as number },
      select: userSelect,
    });
  } catch {
    return null;
  }
});

// The user from an "Authorization: Bearer <api token>" header, e.g. the MCP server.
async function getBearerUser() {
  const match = (await headers()).get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) return undefined;
  const row = await db.apiToken.findUnique({
    where: { tokenHash: hashToken(match[1].trim()) },
    select: { user: { select: userSelect } },
  });
  return row?.user ?? null;
}

// A bearer token wins when present (and an invalid one means "not logged in");
// otherwise fall back to the browser cookie.
export const getUser = cache(async () => {
  const bearer = await getBearerUser();
  return bearer !== undefined ? bearer : getSessionUser();
});
