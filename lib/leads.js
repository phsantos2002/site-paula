import { readJson, writeJson } from "./store";

export async function getLeads() {
  const list = await readJson("leads", []);
  return Array.isArray(list) ? list : [];
}

/** Adiciona um lead (contato do formulário). createdAt vem de fora (route handler). */
export async function addLead(lead, createdAt) {
  const list = await getLeads();
  const item = {
    id: String(createdAt) + "-" + (list.length + 1),
    nome: String(lead.nome || "").slice(0, 120),
    email: String(lead.email || "").slice(0, 160),
    telefone: String(lead.telefone || "").slice(0, 40),
    tipo: String(lead.tipo || "").slice(0, 40),
    mensagem: String(lead.mensagem || "").slice(0, 1000),
    createdAt,
    read: false,
  };
  list.unshift(item);
  await writeJson("leads", list);
  return item;
}

/**
 * Aplica as mudanças do admin (lido/não lido e exclusões) SOBRE a lista atual do servidor.
 * Assim um contato que chegou pelo site enquanto o painel estava aberto nunca é apagado
 * pelo salvamento automático.
 */
export async function saveLeads(list, deleted = []) {
  const current = await getLeads();
  const del = new Set((Array.isArray(deleted) ? deleted : []).map(String));
  const incoming = new Map((Array.isArray(list) ? list : []).map((l) => [String(l.id), l]));
  const merged = current
    .filter((l) => !del.has(String(l.id)))
    .map((l) => (incoming.has(String(l.id)) ? { ...l, read: !!incoming.get(String(l.id)).read } : l));
  await writeJson("leads", merged);
  return merged;
}
