import { getContent } from "@/lib/content";

// Registra eventos numa planilha do Google via um Web App do Google Apps Script.
// O link (webhook) fica no painel (content.tracking.sheetWebhookUrl) ou na env
// SHEET_WEBHOOK_URL. Lido só no servidor — nunca vai ao navegador.
export async function getSheetWebhookUrl() {
  try {
    const c = await getContent();
    return c?.tracking?.sheetWebhookUrl || process.env.SHEET_WEBHOOK_URL || "";
  } catch {
    return process.env.SHEET_WEBHOOK_URL || "";
  }
}

// Colunas fixas da planilha (a ordem casa com o cabeçalho do Apps Script).
export const SHEET_COLUMNS = [
  "data", "evento", "origem", "imovel_codigo", "imovel_titulo",
  "valor", "nome", "email", "telefone", "tipo", "pagina", "ip", "navegador",
];

// Envia uma linha. Nunca lança — rastreamento não pode afetar o site.
export async function logToSheet(row = {}) {
  const url = await getSheetWebhookUrl();
  if (!url) return { ok: false, skipped: true };
  const payload = { data: new Date().toISOString(), ...row };
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
