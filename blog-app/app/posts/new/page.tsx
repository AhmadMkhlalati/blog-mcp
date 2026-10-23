import { redirect } from "next/navigation";
import { PostForm } from "@/components/SimpleForm";
import { getUser } from "@/lib/session";

export default async function NewPostPage() {
  if (!(await getUser())) redirect("/login");
  return (
    <div className="space-y-8 rise">
      <div className="space-y-2">
        <p className="eyebrow">New post</p>
        <h1 className="font-display text-4xl font-semibold">What&apos;s on your mind?</h1>
      </div>
      <PostForm />
    </div>
  );
}
