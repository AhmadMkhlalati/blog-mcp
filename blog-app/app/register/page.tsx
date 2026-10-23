import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="max-w-sm mx-auto space-y-8 rise sm:pt-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-4xl font-semibold">Start writing</h1>
        <p className="text-muted">Create an account to publish posts and join conversations.</p>
      </div>
      <div className="card p-6">
        <AuthForm mode="register" />
      </div>
      <p className="text-sm text-center text-muted">
        Have an account? <Link href="/login" className="link text-ink font-medium">Log in</Link>
      </p>
    </div>
  );
}
