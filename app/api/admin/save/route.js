import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveContent } from "@/lib/content";

export const runtime = "nodejs";

export async function POST(req) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  try {
    const data = await req.json();
    const content = await saveContent(data);
    return NextResponse.json({ ok: true, content });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Falha ao salvar." }, { status: 500 });
  }
}
