import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default async function Home() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } }, _count: { select: { comments: true } } },
  });
  const [featured, ...rest] = posts;

  return (
    <div className="space-y-12">
      <section className="rise space-y-3">
        <p className="eyebrow">The latest</p>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-[1.05]">
          Stories, notes <em className="text-accent font-normal">&amp;</em> half-formed ideas.
        </h1>
      </section>

      {!featured && (
        <div className="card p-10 text-center space-y-4 rise">
          <p className="font-display text-2xl">Nothing here yet.</p>
          <p className="text-muted">Be the first to write something worth reading.</p>
          <Link href="/posts/new" className="btn">Write the first post</Link>
        </div>
      )}

      {featured && (
        <Link
          href={`/posts/${featured.id}`}
          className="group card block p-6 sm:p-8 rise transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-16px_rgb(0_0_0/0.25)]"
          style={{ animationDelay: "80ms" }}
        >
          <p className="eyebrow text-accent!">Featured</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-3 leading-tight group-hover:text-accent transition-colors">
            {featured.title}
          </h2>
          <p className="mt-4 text-lg text-muted line-clamp-3">{featured.content}</p>
          <Byline name={featured.author.name} date={featured.createdAt} comments={featured._count.comments} />
        </Link>
      )}

      {rest.length > 0 && (
        <ol className="divide-y divide-line border-y border-line">
          {rest.map((p, i) => (
            <li key={p.id} className="rise" style={{ animationDelay: `${140 + i * 50}ms` }}>
              <Link href={`/posts/${p.id}`} className="group flex gap-5 py-6">
                <span className="font-display text-2xl text-muted/60 tabular-nums w-8 shrink-0 pt-0.5">
                  {String(i + 2).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-semibold leading-snug group-hover:text-accent transition-colors">
                    {p.title}
                  </h2>
                  <p className="mt-1.5 text-muted line-clamp-2">{p.content}</p>
                  <Byline name={p.author.name} date={p.createdAt} comments={p._count.comments} />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Byline({ name, date, comments }: { name: string; date: Date; comments: number }) {
  return (
    <div className="mt-4 flex items-center gap-2.5 text-sm text-muted">
      <Avatar name={name} className="w-6! h-6! text-[0.6rem]!" />
      <span className="text-ink font-medium">{name}</span>
      <span aria-hidden>·</span>
      <span>{fmt(date)}</span>
      <span aria-hidden>·</span>
      <span>
        {comments} {comments === 1 ? "comment" : "comments"}
      </span>
    </div>
  );
}
