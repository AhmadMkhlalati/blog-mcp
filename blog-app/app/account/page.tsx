import { redirect } from "next/navigation";
import { TokenManager } from "@/components/TokenManager";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tokens = await db.apiToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true },
  });

  return (
    <div className="space-y-8 rise">
      <div className="space-y-3">
        <p className="eyebrow">Account</p>
        <h1 className="font-display text-4xl font-semibold">API tokens</h1>
        <p className="text-muted max-w-xl">
          Tokens let the MCP server (and any LLM using it) act as you without ever seeing your password. Add one to
          your MCP client as{" "}
          <code className="font-mono text-[0.85em] bg-accent-soft text-accent px-1.5 py-0.5 rounded">
            Authorization: Bearer &lt;token&gt;
          </code>
          .
        </p>
      </div>
      <TokenManager tokens={tokens.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))} />
    </div>
  );
}
