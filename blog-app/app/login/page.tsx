import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto space-y-8 rise sm:pt-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-4xl font-semibold">Welcome back</h1>
        <p className="text-muted">Log in to write, comment and manage your tokens.</p>
      </div>
      <div className="card p-6">
        <AuthForm mode="login" />
      </div>
      <p className="text-sm text-center text-muted">
        No account? <Link href="/register" className="link text-ink font-medium">Create one</Link>
      </p>
    </div>
  );
}
