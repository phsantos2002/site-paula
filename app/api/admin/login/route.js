import { NextResponse } from "next/server";
import { checkPassword, sessionToken, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false, error: "Senha incorreta." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
