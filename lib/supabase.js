import { createClient } from "@supabase/supabase-js";

let client = null;

/** Retorna o client do Supabase se as variáveis estiverem configuradas; senão null (usa arquivos). */
export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const UPLOAD_BUCKET = "uploads";
