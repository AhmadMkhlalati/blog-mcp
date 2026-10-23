import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

export async function GET() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } }, _count: { select: { comments: true } } },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  if (!title || !content)
    return NextResponse.json({ error: "Title and content are required." }, { status: 400 });

  const post = await db.post.create({ data: { title, content, authorId: user.id } });
  return NextResponse.json(post, { status: 201 });
}
