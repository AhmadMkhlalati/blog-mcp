import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CommentForm, DeleteButton } from "@/components/SimpleForm";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const [post, user] = await Promise.all([
    db.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { name: true } },
        comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      },
    }),
    getUser(),
  ]);
  if (!post) notFound();

  const minutes = Math.max(1, Math.round(post.content.split(/\s+/).length / 220));

  return (
    <article className="space-y-14">
      <header className="space-y-6 rise">
        <Link href="/" className="btn-ghost -ml-3">← All posts</Link>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.1]">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted border-y border-line py-4">
          <Avatar name={post.author.name} />
          <div>
            <p className="text-ink font-medium">{post.author.name}</p>
            <p>
              {post.createdAt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} ·{" "}
              {minutes} min read
            </p>
          </div>
          {user?.id === post.authorId && (
            <DeleteButton url={`/api/posts/${post.id}`} label="Delete post" redirectTo="/" className="btn-danger ml-auto" />
          )}
        </div>
      </header>

      <div className="prose-body rise" style={{ animationDelay: "80ms" }}>
        {post.content}
      </div>

      <section className="space-y-6 pt-10 border-t border-line">
        <h2 className="font-display text-2xl font-semibold">
          Conversation <span className="text-muted font-normal">({post.comments.length})</span>
        </h2>

        {post.comments.length === 0 && <p className="text-muted">No comments yet. Start the conversation.</p>}

        <ul className="space-y-5">
          {post.comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.author.name} />
              <div className="flex-1 min-w-0 card px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{c.author.name}</span>
                  <span className="text-muted">
                    {c.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  {user?.id === c.authorId && (
                    <DeleteButton url={`/api/comments/${c.id}`} label="Delete" className="btn-danger ml-auto" />
                  )}
                </div>
                <p className="whitespace-pre-wrap mt-1 leading-relaxed">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>

        {user ? (
          <div className="flex gap-3">
            <Avatar name={user.name} />
            <div className="flex-1">
              <CommentForm postId={post.id} />
            </div>
          </div>
        ) : (
          <div className="card p-5 text-center text-sm">
            <Link href="/login" className="link font-medium">Log in</Link> to join the conversation.
          </div>
        )}
      </section>
    </article>
  );
}
