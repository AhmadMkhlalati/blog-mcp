import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !email.includes("@"))
    return NextResponse.json({ error: "Name and a valid email are required." }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  if (await db.user.findUnique({ where: { email } }))
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });

  const user = await db.user.create({
    data: { name, email, password: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name }, { status: 201 });
}
