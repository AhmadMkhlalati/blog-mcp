import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });

  const { count } = await db.comment.updateMany({ where: { id, authorId: user.id }, data: { content } });
  if (!count) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  return NextResponse.json(await db.comment.findUnique({ where: { id } }));
}

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const id = Number((await params).id);
  const { count } = await db.comment.deleteMany({ where: { id, authorId: user.id } });
  if (!count) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
