"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

export function PostForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const { ok, json } = await send("/api/posts", "POST", Object.fromEntries(new FormData(e.currentTarget)));
    if (ok) {
      router.push(`/posts/${json.id}`);
      router.refresh();
    } else {
      setError(json.error ?? "Something went wrong.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        name="title"
        placeholder="A title worth clicking"
        required
        className="input font-display text-2xl! font-semibold py-3!"
      />
      <textarea
        name="content"
        placeholder="Tell your story…"
        required
        rows={14}
        className="input font-display text-lg! leading-relaxed resize-y"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end">
        <button disabled={pending} className="btn">{pending ? "Publishing…" : "Publish post →"}</button>
      </div>
    </form>
  );
}

export function CommentForm({ postId }: { postId: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setError("");
    const { ok, json } = await send(`/api/posts/${postId}/comments`, "POST", {
      content: new FormData(form).get("content"),
    });
    if (ok) {
      form.reset();
      router.refresh();
    } else {
      setError(json.error ?? "Something went wrong.");
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea name="content" placeholder="Add to the conversation…" required rows={3} className="input resize-y" />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end">
        <button disabled={pending} className="btn">{pending ? "Posting…" : "Comment"}</button>
      </div>
    </form>
  );
}

export function DeleteButton({
  url,
  label,
  redirectTo,
  className,
}: {
  url: string;
  label: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      className={className ?? "btn-danger"}
      onClick={async () => {
        if (!confirm("Are you sure?")) return;
        const { ok } = await send(url, "DELETE");
        if (!ok) return;
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="btn-ghost"
      onClick={async () => {
        await send("/api/auth/logout", "POST");
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
