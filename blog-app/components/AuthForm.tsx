"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Name</span>
          <input name="name" placeholder="Ada Lovelace" autoComplete="name" required className="input" />
        </label>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required className="input" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          className="input"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button disabled={pending} className="btn w-full py-3!">
        {pending ? "Please wait…" : mode === "login" ? "Log in" : "Register"}
      </button>
    </form>
  );
}
