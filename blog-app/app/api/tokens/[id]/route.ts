import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const id = Number((await params).id);
  const { count } = await db.apiToken.deleteMany({ where: { id, userId: user.id } });
  if (!count) return NextResponse.json({ error: "Token not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
