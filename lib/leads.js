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

/** Substitui a lista (usado pelo admin para marcar como lido / excluir). */
export async function saveLeads(list) {
  const clean = (Array.isArray(list) ? list : []).map((l) => ({
    id: l.id,
    nome: l.nome || "",
    email: l.email || "",
    telefone: l.telefone || "",
    tipo: l.tipo || "",
    mensagem: l.mensagem || "",
    createdAt: l.createdAt || null,
    read: !!l.read,
  }));
  await writeJson("leads", clean);
  return clean;
}
