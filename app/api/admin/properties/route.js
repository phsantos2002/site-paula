import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveProperties } from "@/lib/properties";

export const runtime = "nodejs";

export async function POST(req) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  try {
    const data = await req.json();
    const list = Array.isArray(data) ? data : data.properties;
    const properties = await saveProperties(list || []);
    return NextResponse.json({ ok: true, properties });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Falha ao salvar imóveis." }, { status: 500 });
  }
}
