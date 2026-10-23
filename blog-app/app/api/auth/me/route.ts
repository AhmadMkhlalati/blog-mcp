import { NextResponse } from "next/server";
import { getUser } from "@/lib/session";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  return NextResponse.json(user);
}
