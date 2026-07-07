/**
 * URL pública do site — usada para links absolutos (Open Graph, sitemap, robots).
 * Ordem: NEXT_PUBLIC_SITE_URL (domínio próprio) -> URL do deploy na Vercel -> localhost.
 */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
