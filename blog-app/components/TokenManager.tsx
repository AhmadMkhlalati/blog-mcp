"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Token = { id: number; name: string; createdAt: string };

export function TokenManager({ tokens }: { tokens: Token[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [created, setCreated] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setCreated(json.token);
      setCopied(false);
      setName("");
      router.refresh();
    } else {
      setError(json.error ?? "Something went wrong.");
    }
    setPending(false);
  }

  async function revoke(id: number) {
    if (!confirm("Revoke this token? Anything using it will stop working.")) return;
    await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card p-2 flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name (e.g. Claude Desktop)"
          className="input border-transparent! shadow-none! bg-transparent!"
        />
        <button disabled={pending} className="btn whitespace-nowrap">
          {pending ? "Creating…" : "+ Create token"}
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}

      {created && (
        <div className="rounded-2xl p-5 space-y-3 border border-ok/40 bg-ok/8 rise">
          <p className="text-sm font-semibold text-ok">✓ Copy this token now. It won&apos;t be shown again.</p>
          <div className="flex gap-2 items-stretch">
            <code className="flex-1 min-w-0 break-all font-mono text-sm card px-3 py-2">{created}</code>
            <button
              className="btn"
              onClick={() => {
                navigator.clipboard.writeText(created);
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <ul className="card divide-y divide-line overflow-hidden">
        {tokens.length === 0 && <li className="p-6 text-center text-muted">No tokens yet.</li>}
        {tokens.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-5 py-4">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-accent-soft text-accent font-mono text-sm">
              ⚿
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-medium truncate">{t.name}</span>
              <span className="block text-sm text-muted">
                Created {new Date(t.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </span>
            </span>
            <button className="btn-danger" onClick={() => revoke(t.id)}>
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
