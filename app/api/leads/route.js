import { NextResponse } from "next/server";
import { addLead } from "@/lib/leads";
import { sendMetaEvent, metaCtxFromRequest } from "@/lib/metaCapi";
import { logToSheet } from "@/lib/sheetLog";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    // honeypot anti-spam (campo oculto "website")
    if (body.website) return NextResponse.json({ ok: true });
    if (!body.nome || !body.telefone) {
      return NextResponse.json({ ok: false, error: "Nome e telefone são obrigatórios." }, { status: 400 });
    }
    const lead = await addLead(body, Date.now());
    const ctx = metaCtxFromRequest(req);
    // Conversão server-side (CAPI). Deduplica com o Pixel do navegador via eventId.
    await sendMetaEvent(
      {
        eventName: "Lead",
        eventId: body.eventId,
        eventSourceUrl: body.eventSourceUrl,
        userData: { email: body.email, phone: body.telefone, firstName: body.nome },
        customData: { content_name: "Cadastro de imóvel", lead_type: body.tipo || "" },
      },
      ctx
    ).catch(() => {});
    // Linha na planilha do Google (dados legíveis do lead do formulário).
    await logToSheet({
      evento: "Lead",
      origem: "formulario",
      nome: body.nome || "",
      email: body.email || "",
      telefone: body.telefone || "",
      tipo: body.tipo || "",
      pagina: body.eventSourceUrl || "",
      ip: ctx.ip || "",
      navegador: ctx.userAgent || "",
    }).catch(() => {});
    return NextResponse.json({ ok: true, id: lead.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha ao enviar." }, { status: 500 });
  }
}
