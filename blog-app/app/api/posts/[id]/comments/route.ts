import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const postId = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });

  if (!(await db.post.findUnique({ where: { id: postId }, select: { id: true } })))
    return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const comment = await db.comment.create({ data: { content, postId, authorId: user.id } });
  return NextResponse.json(comment, { status: 201 });
}
