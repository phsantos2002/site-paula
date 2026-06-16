import fs from "fs";
import path from "path";
import { getSupabase } from "./supabase";

const DIR = path.join(process.cwd(), "data");

// keys lógicas -> arquivo local (mantém compatibilidade com o que já existe)
const FILE_FOR = {
  content: "site-content.json",
  properties: "properties.json",
  leads: "leads.json",
};

function localPath(key) {
  return path.join(DIR, FILE_FOR[key] || `${key}.json`);
}

/**
 * Lê um "documento" JSON (content / properties / leads).
 * Usa Supabase (tabela `singletons`) se configurado; senão lê do arquivo local.
 */
export async function readJson(key, fallback) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("singletons").select("data").eq("key", key).maybeSingle();
    if (error || !data) return fallback;
    return data.data ?? fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(localPath(key), "utf8"));
  } catch {
    return fallback;
  }
}

/** Grava um documento JSON. Supabase (upsert) se configurado; senão arquivo local. */
export async function writeJson(key, value) {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("singletons").upsert({ key, data: value }, { onConflict: "key" });
    if (error) throw error;
    return value;
  }
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(localPath(key), JSON.stringify(value, null, 2), "utf8");
  return value;
}
