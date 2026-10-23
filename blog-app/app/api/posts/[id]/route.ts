import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const data: { title?: string; content?: string } = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.content !== undefined) data.content = String(body.content).trim();
  if (data.title === "" || data.content === "" || !Object.keys(data).length)
    return NextResponse.json({ error: "Provide a non-empty title and/or content." }, { status: 400 });

  const { count } = await db.post.updateMany({ where: { id, authorId: user.id }, data });
  if (!count) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json(await db.post.findUnique({ where: { id } }));
}

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const id = Number((await params).id);
  const { count } = await db.post.deleteMany({ where: { id, authorId: user.id } });
  if (!count) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
