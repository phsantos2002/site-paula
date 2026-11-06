import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listarMapas, salvarMapa, excluirMapa } from "@/lib/mapas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const negado = () => NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });

/** Lista todos os mapas mentais. */
export async function GET() {
  if (!isAuthenticated()) return negado();
  try {
    return NextResponse.json({ ok: true, mapas: await listarMapas() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Falha ao carregar os mapas." }, { status: 500 });
  }
}

/** Grava um mapa: { id, data }. */
export async function POST(req) {
  if (!isAuthenticated()) return negado();
  try {
    const { id, data } = await req.json();
    const mapa = await salvarMapa(String(id || ""), data);
    return NextResponse.json({ ok: true, atualizado: mapa.atualizado || 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Falha ao salvar o mapa." }, { status: 400 });
  }
}

/** Exclui um mapa: ?id=... */
export async function DELETE(req) {
  if (!isAuthenticated()) return negado();
  try {
    const id = new URL(req.url).searchParams.get("id") || "";
    await excluirMapa(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Falha ao excluir o mapa." }, { status: 400 });
  }
}
