import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name });
}
