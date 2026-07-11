// Dispara um evento no Pixel do navegador E na API de Conversões (servidor) com o MESMO
// eventId, para a Meta deduplicar. Uso só no cliente; seguro chamar mesmo sem Pixel ativo.
export function newEventId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function metaTrack(eventName, opts = {}) {
  if (typeof window === "undefined") return null;
  const eventId = opts.eventId || newEventId();
  const customData = opts.customData || {};
  const usePixel = opts.pixel !== false; // false = não dispara no Pixel do navegador
  const toMeta = opts.toMeta !== false;  // false = não reenvia à Meta (só planilha)
  if (usePixel) {
    try {
      if (window.fbq) window.fbq("track", eventName, customData, { eventID: eventId });
    } catch {
      /* pixel ausente/bloqueado — segue para o CAPI/planilha */
    }
  }
  try {
    fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        customData,
        userData: opts.userData || {},
        toMeta,
      }),
    }).catch(() => {});
  } catch {
    /* ignora */
  }
  return eventId;
}
