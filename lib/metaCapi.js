import crypto from "crypto";
import { getContent } from "@/lib/content";

// API de Conversões da Meta (server-side). O TOKEN é secreto e vive só no servidor
// (variável de ambiente META_CAPI_TOKEN) — nunca vai para o navegador nem para o content.
// O Pixel ID vem do painel (content.tracking.metaPixelId) ou de META_PIXEL_ID.
const GRAPH_VERSION = "v19.0";

function sha256(v) {
  return crypto.createHash("sha256").update(v).digest("hex");
}
function hashEmail(v) {
  return v ? sha256(String(v).trim().toLowerCase()) : undefined;
}
function hashPhone(v) {
  const d = String(v || "").replace(/\D/g, "");
  return d ? sha256(d) : undefined;
}
function hashText(v) {
  return v ? sha256(String(v).trim().toLowerCase()) : undefined;
}

export async function getMetaPixelId() {
  try {
    const c = await getContent();
    return c?.tracking?.metaPixelId || process.env.META_PIXEL_ID || "";
  } catch {
    return process.env.META_PIXEL_ID || "";
  }
}

/** Extrai IP, User-Agent e cookies do Pixel (_fbp/_fbc) de um Request de rota Next. */
export function metaCtxFromRequest(req) {
  const h = req.headers;
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || undefined;
  const userAgent = h.get("user-agent") || undefined;
  const cookie = h.get("cookie") || "";
  const ck = (name) => {
    const m = cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
    return m ? decodeURIComponent(m[1]) : undefined;
  };
  return { ip, userAgent, fbp: ck("_fbp"), fbc: ck("_fbc") };
}

/**
 * Envia um evento server-side para a Meta. Nunca lança — retorna { ok }.
 * Deduplica com o Pixel do navegador quando `eventId` é o mesmo dos dois lados.
 */
export async function sendMetaEvent(event = {}, ctx = {}) {
  // Pixel e token vêm do painel (content.tracking); env é fallback. O token é lido
  // AQUI no servidor e nunca sai para o navegador.
  const c = await getContent().catch(() => null);
  const pixelId = event.pixelId || c?.tracking?.metaPixelId || process.env.META_PIXEL_ID || "";
  const token = c?.tracking?.metaCapiToken || process.env.META_CAPI_TOKEN || "";
  if (!token || !pixelId) return { ok: false, skipped: true };

  const ud = event.userData || {};
  const user_data = {
    em: hashEmail(ud.email) && [hashEmail(ud.email)],
    ph: hashPhone(ud.phone) && [hashPhone(ud.phone)],
    fn: hashText(ud.firstName) && [hashText(ud.firstName)],
    ln: hashText(ud.lastName) && [hashText(ud.lastName)],
    client_ip_address: ctx.ip || undefined,
    client_user_agent: ctx.userAgent || undefined,
    fbp: ctx.fbp || undefined,
    fbc: ctx.fbc || undefined,
  };
  Object.keys(user_data).forEach((k) => (user_data[k] == null || user_data[k] === false) && delete user_data[k]);

  const data = [{
    event_name: event.eventName || "Lead",
    event_time: Math.floor(Date.now() / 1000),
    event_id: event.eventId || undefined,
    event_source_url: event.eventSourceUrl || undefined,
    action_source: event.actionSource || "website",
    user_data,
    custom_data: event.customData || {},
  }];
  const payload = { data };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok && !j.error, response: j };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
