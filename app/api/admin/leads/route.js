import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveLeads } from "@/lib/leads";

export const runtime = "nodejs";

export async function POST(req) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  try {
    const data = await req.json();
    const list = Array.isArray(data) ? data : data.leads;
    const leads = await saveLeads(list || []);
    return NextResponse.json({ ok: true, leads });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha ao salvar." }, { status: 500 });
  }
}
