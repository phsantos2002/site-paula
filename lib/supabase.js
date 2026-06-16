import { createClient } from "@supabase/supabase-js";

let client = null;

/** Retorna o client do Supabase se as variáveis estiverem configuradas; senão null (usa arquivos). */
export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false },
      // Sem cache: garante que o site sempre leia o conteúdo mais recente
      // (evita o Data Cache do Next/Vercel "congelar" os dados salvos no admin).
      global: {
        fetch: (input, init = {}) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
  }
  return client;
}

export const UPLOAD_BUCKET = "uploads";
