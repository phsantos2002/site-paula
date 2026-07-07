import { getPublishedProperties } from "@/lib/properties";
import { siteUrl } from "@/lib/site";

// Recalcula a cada acesso: novos imóveis entram no sitemap sem rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const base = siteUrl();
  const properties = await getPublishedProperties();

  const staticPages = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/imoveis`, changeFrequency: "daily", priority: 0.9 },
  ];

  const propertyPages = properties.map((p) => ({
    url: `${base}/imovel/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...propertyPages];
}
