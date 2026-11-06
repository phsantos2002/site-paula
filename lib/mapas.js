import fs from "fs";
import path from "path";
import { getSupabase } from "./supabase";
import { mapasIniciais } from "./mapasProntos";

/**
 * Mapas mentais do painel. Cada mapa é um registro próprio (não um JSON único com todos),
 * então salvar um mapa nunca sobrescreve outro — mesmo com várias pessoas usando ao mesmo tempo.
 * - Supabase: tabela `singletons`, chave "mapa:<id>".
 * - Local: arquivos em data/mapas/<id>.json.
 */
const PREFIXO = "mapa:";
const DIR = path.join(process.cwd(), "data", "mapas");
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB por mapa

export function idValido(id) {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(id);
}

// Marca de que os mapas prontos já foram criados nesta base (fica fora do prefixo "mapa:",
// então não aparece na lista). Assim um mapa pronto apagado pela equipe não volta.
const CHAVE_SEMENTE = "config:mapas_prontos";
const ARQ_SEMENTE = path.join(process.cwd(), "data", "mapas-prontos.json");

async function semearUmaVez() {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("singletons").select("key").eq("key", CHAVE_SEMENTE).maybeSingle();
    if (error || data) return;
    const { error: e2 } = await sb.from("singletons").insert({ key: CHAVE_SEMENTE, data: { em: Date.now() } });
    if (e2) return; // outra instância criou a marca primeiro
  } else {
    if (fs.existsSync(ARQ_SEMENTE)) return;
    fs.mkdirSync(path.dirname(ARQ_SEMENTE), { recursive: true });
    fs.writeFileSync(ARQ_SEMENTE, JSON.stringify({ em: Date.now() }), "utf8");
  }
  for (const m of mapasIniciais()) {
    if (!(await lerMapa(m.id))) await salvarMapa(m.id, m);
  }
}

export async function listarMapas() {
  try { await semearUmaVez(); } catch (e) { console.warn("mapas prontos:", e?.message || e); }
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("singletons").select("key,data").like("key", PREFIXO + "%");
    if (error) throw error;
    return (data || []).map((r) => r.data).filter((m) => m && m.id && m.raiz);
  }
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")); } catch { return null; } })
    .filter((m) => m && m.id && m.raiz);
}

/** Grava um mapa. Ignora versão mais antiga que a gravada (proteção contra salvamento atrasado). */
export async function salvarMapa(id, mapa) {
  if (!idValido(id)) throw new Error("id inválido");
  if (!mapa || typeof mapa !== "object" || !mapa.raiz) throw new Error("mapa inválido");
  const dados = { ...mapa, id };
  if (Buffer.byteLength(JSON.stringify(dados)) > MAX_BYTES) throw new Error("Mapa grande demais (máx. 2 MB).");
  const atual = await lerMapa(id);
  if (atual && (atual.atualizado || 0) > (dados.atualizado || 0)) return atual;
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("singletons").upsert({ key: PREFIXO + id, data: dados }, { onConflict: "key" });
    if (error) throw error;
    return dados;
  }
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, id + ".json"), JSON.stringify(dados), "utf8");
  return dados;
}

export async function lerMapa(id) {
  if (!idValido(id)) return null;
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("singletons").select("data").eq("key", PREFIXO + id).maybeSingle();
    if (error || !data) return null;
    return data.data;
  }
  try { return JSON.parse(fs.readFileSync(path.join(DIR, id + ".json"), "utf8")); } catch { return null; }
}

export async function excluirMapa(id) {
  if (!idValido(id)) throw new Error("id inválido");
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("singletons").delete().eq("key", PREFIXO + id);
    if (error) throw error;
    return;
  }
  try { fs.unlinkSync(path.join(DIR, id + ".json")); } catch {}
}
