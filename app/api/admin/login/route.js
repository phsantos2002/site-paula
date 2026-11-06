import { NextResponse } from "next/server";
import {
  adminPassword, checkPassword, sessionToken, COOKIE_NAME, SESSION_MAX_AGE,
  loginBloqueado, registrarFalha, limparFalhas,
} from "@/lib/auth";

export const runtime = "nodejs";

function ipDe(req) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export async function POST(req) {
  if (!adminPassword()) {
    return NextResponse.json(
      { ok: false, error: "Painel bloqueado: defina a variável ADMIN_PASSWORD no servidor." },
      { status: 503 }
    );
  }
  const ip = ipDe(req);
  const espera = loginBloqueado(ip);
  if (espera) {
    return NextResponse.json(
      { ok: false, error: `Muitas tentativas. Tente de novo em ${Math.ceil(espera / 60)} min.` },
      { status: 429 }
    );
  }
  const { password } = await req.json().catch(() => ({}));
  if (!checkPassword(password)) {
    registrarFalha(ip);
    return NextResponse.json({ ok: false, error: "Senha incorreta." }, { status: 401 });
  }
  limparFalhas(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
