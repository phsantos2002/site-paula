import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listarBairro, ranquear, detalhe, origemValida } from "@/lib/importador";

export const runtime = "nodejs";
export const maxDuration = 60; // varrer um bairro grande leva alguns segundos
export const dynamic = "force-dynamic";

/**
 * POST { acao: "candidatos", fonte, bairro }  -> imóveis do bairro ranqueados por oportunidade
 * POST { acao: "detalhe", fonte, url }        -> ficha completa de um imóvel (fotos, descrição…)
 */
export async function POST(req) {
  if (!isAuthenticated()) return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const fonte = origemValida(body.fonte);
  if (!fonte) return NextResponse.json({ ok: false, error: "Informe o endereço do site (https://…)." }, { status: 400 });
  try {
    if (body.acao === "candidatos") {
      const bairro = String(body.bairro || "").trim().slice(0, 80);
      if (!bairro) return NextResponse.json({ ok: false, error: "Informe o bairro." }, { status: 400 });
      const r = await listarBairro(fonte, bairro);
      return NextResponse.json({ ok: true, bairro, total: r.total, lidos: r.cards.length, candidatos: ranquear(r.cards) });
    }
    if (body.acao === "detalhe") {
      return NextResponse.json({ ok: true, imovel: await detalhe(fonte, String(body.url || "")) });
    }
    return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Não foi possível ler o site: " + (e?.message || e) }, { status: 502 });
  }
}
