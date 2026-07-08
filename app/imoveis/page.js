import { getContent, seoFor } from "@/lib/content";
import { getPublishedProperties, PROPERTY_TYPES } from "@/lib/properties";
import ThemeStyle from "@/components/ThemeStyle";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import PropertySearch from "@/components/PropertySearch";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const seo = seoFor(await getContent());
  return {
    title: `Imóveis | ${seo.fullName}`,
    description:
      "Casas, apartamentos, terrenos e imóveis comerciais à venda e para alugar. Busque por bairro, tipo e valor.",
    alternates: { canonical: "/imoveis" },
  };
}

export default async function ImoveisPage({ searchParams }) {
  const c = await getContent();
  const properties = await getPublishedProperties();
  const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))];

  return (
    <main className="min-h-screen bg-surface-alt">
      <ThemeStyle colors={c.colors} />
      <Header brand={c.brand} contact={c.contact} nav={c.nav} header={c.header} />
      <div className="bg-ink/95 pt-[85px]" />
      <PropertySearch
        properties={properties}
        cities={cities}
        types={PROPERTY_TYPES}
        initial={{
          q: searchParams?.q || "",
          city: searchParams?.cidade || "",
          operation: searchParams?.operacao || "",
          type: searchParams?.tipo || "",
        }}
      />
      <Footer brand={c.brand} contact={c.contact} footer={c.footer} />
      <WhatsAppFloat contact={c.contact} />
    </main>
  );
}
