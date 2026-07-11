import { NextResponse } from "next/server";
import { addLead } from "@/lib/leads";
import { sendMetaEvent, metaCtxFromRequest } from "@/lib/metaCapi";

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
    // Conversão server-side (CAPI). Deduplica com o Pixel do navegador via eventId.
    await sendMetaEvent(
      {
        eventName: "Lead",
        eventId: body.eventId,
        eventSourceUrl: body.eventSourceUrl,
        userData: { email: body.email, phone: body.telefone, firstName: body.nome },
        customData: { content_name: "Cadastro de imóvel", lead_type: body.tipo || "" },
      },
      metaCtxFromRequest(req)
    ).catch(() => {});
    return NextResponse.json({ ok: true, id: lead.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha ao enviar." }, { status: 500 });
  }
}
