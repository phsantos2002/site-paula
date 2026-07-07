import { siteUrl } from "@/lib/site";

/** robots.txt dinâmico — libera o site, bloqueia painel e API, aponta o sitemap. */
export default function robots() {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
