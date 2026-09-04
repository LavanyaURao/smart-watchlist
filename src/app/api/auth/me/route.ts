import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
