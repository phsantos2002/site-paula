import { NextResponse } from "next/server";
import { sendMetaEvent, metaCtxFromRequest } from "@/lib/metaCapi";

export const runtime = "nodejs";

// Recebe eventos do navegador (ex.: clique no WhatsApp) e reenvia à Meta pelo servidor,
// com o mesmo eventId do Pixel para deduplicar. Nunca quebra o cliente.
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    await sendMetaEvent(
      {
        eventName: body.eventName || "Lead",
        eventId: body.eventId,
        eventSourceUrl: body.eventSourceUrl,
        userData: body.userData || {},
        customData: body.customData || {},
      },
      metaCtxFromRequest(req)
    );
  } catch {
    /* ignora — rastreamento nunca deve afetar o usuário */
  }
  return NextResponse.json({ ok: true });
}
