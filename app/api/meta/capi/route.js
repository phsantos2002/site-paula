import { NextResponse } from "next/server";
import { sendMetaEvent, metaCtxFromRequest } from "@/lib/metaCapi";
import { logToSheet } from "@/lib/sheetLog";

export const runtime = "nodejs";

// Recebe eventos do navegador (WhatsApp, ViewContent, PageView) e:
//  - reenvia à Meta pela CAPI (quando toMeta !== false), com o mesmo eventId (dedup);
//  - registra uma linha na planilha do Google (se configurada).
// Nunca quebra o cliente.
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const ctx = metaCtxFromRequest(req);
    const cd = body.customData || {};

    if (body.toMeta !== false) {
      await sendMetaEvent(
        {
          eventName: body.eventName || "Lead",
          eventId: body.eventId,
          eventSourceUrl: body.eventSourceUrl,
          userData: body.userData || {},
          customData: cd,
        },
        ctx
      );
    }

    const isView = body.eventName === "ViewContent";
    const origem =
      cd.channel === "whatsapp" ? "whatsapp" :
      isView ? "imovel" :
      body.eventName === "PageView" ? "pagina" : "";
    await logToSheet({
      evento: body.eventName || "",
      origem,
      imovel_codigo: isView ? (Array.isArray(cd.content_ids) ? cd.content_ids[0] : cd.content_ids || "") : "",
      imovel_titulo: isView ? cd.content_name || "" : "",
      valor: cd.value || "",
      pagina: body.eventSourceUrl || "",
      ip: ctx.ip || "",
      navegador: ctx.userAgent || "",
    });
  } catch {
    /* rastreamento nunca deve afetar o usuário */
  }
  return NextResponse.json({ ok: true });
}
