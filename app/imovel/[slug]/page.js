import { notFound } from "next/navigation";
import { getContent, seoFor } from "@/lib/content";
import { getPublishedProperty } from "@/lib/properties";
import { formatBRL } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import ThemeStyle from "@/components/ThemeStyle";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import PropertyGallery from "@/components/PropertyGallery";
import PropertySpecs from "@/components/PropertySpecs";
import StatusBadge from "@/components/StatusBadge";
import ViewContentTracker from "@/components/ViewContentTracker";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const p = await getPublishedProperty(params.slug);
  const seo = seoFor(await getContent());
  if (!p) return { title: `Imóvel | ${seo.fullName}` };

  const bits = [];
  if (p.area > 0) bits.push(`${p.area} m²`);
  if (p.bedrooms > 0) bits.push(`${p.bedrooms} dorm.`);
  if (p.suites > 0) bits.push(`${p.suites} suíte${p.suites > 1 ? "s" : ""}`);
  if (p.parking > 0) bits.push(`${p.parking} vaga${p.parking > 1 ? "s" : ""}`);
  const priceTxt =
    p.price > 0 ? formatBRL(p.price) : p.rentPrice > 0 ? `${formatBRL(p.rentPrice)}/mês` : "";

  const description = [
    `${p.type} em ${p.neighborhood}, ${p.city}/${p.state}.`,
    bits.join(" · "),
    priceTxt && priceTxt,
    `Cód. ${p.code}. Fale com ${seo.fullName}.`,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const image = p.coverImage || p.images?.[0];
  const url = `/imovel/${p.slug}`;

  return {
    title: `${p.title} | ${seo.fullName}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: p.title,
      description,
      url,
      type: "website",
      images: image ? [{ url: image, alt: p.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyPage({ params }) {
  const c = await getContent();
  const p = await getPublishedProperty(params.slug);
  if (!p) notFound();

  // Mensagem do WhatsApp já preenchida com os dados deste imóvel.
  const brokerName = [c.brand?.name, c.brand?.nameHighlight].filter(Boolean).join(" ").trim();
  const priceLine =
    p.price > 0
      ? `Valor: ${formatBRL(p.price)}`
      : p.rentPrice > 0
      ? `Aluguel: ${formatBRL(p.rentPrice)}/mês`
      : "";
  const locationLine = [p.neighborhood, p.city && `${p.city}${p.state ? `/${p.state}` : ""}`].filter(Boolean).join(" - ");
  const propUrl = `${siteUrl()}/imovel/${p.slug}`;
  const detailLines = [
    p.title,
    `Código: ${p.code}`,
    locationLine && `Local: ${locationLine}`,
    priceLine,
  ].filter(Boolean);
  const waMessage = [
    `Olá${brokerName ? ` ${brokerName}` : ""}, tenho interesse neste imóvel:`,
    "",
    ...detailLines,
    "",
    propUrl,
  ].join("\n");
  const wa = `https://wa.me/${c.contact.whatsapp || ""}?text=${encodeURIComponent(waMessage)}`;

  const contentValue = p.price > 0 ? p.price : p.rentPrice;

  return (
    <main className="min-h-screen bg-white">
      <ViewContentTracker id={p.code} name={p.title} value={contentValue} />
      <ThemeStyle colors={c.colors} />
      <Header brand={c.brand} contact={c.contact} nav={c.nav} header={c.header} />
      <div className="h-[85px] bg-ink" />

      <div className="px-6 py-8 md:px-[60px]">
        {/* Breadcrumb */}
        <p className="text-sm text-ink-muted">
          <a href="/" className="hover:text-primary-dark">Início</a> ›{" "}
          <a href="/imoveis" className="hover:text-primary-dark">{p.city}</a> ›{" "}
          <span className="text-ink-secondary">{p.neighborhood}</span>
        </p>

        {/* Galeria */}
        <div className="mt-4">
          <PropertyGallery images={p.images} alt={p.title} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Coluna principal */}
          <div>
            {p.status && p.status !== "disponivel" && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                <StatusBadge status={p.status} />
              </div>
            )}
            <h1 className="font-poppins text-2xl font-medium leading-snug text-ink-secondary md:text-3xl">
              {p.title}
            </h1>
            <p className="mt-2 font-poppins text-xl font-bold text-ink">{p.type}</p>
            <p className="text-ink-secondary">{p.city} - {p.state}</p>
            <p className="text-sm text-ink-muted">{p.neighborhood} - {p.city}/{p.state}</p>
            <p className="mt-1 text-sm font-semibold text-ink-secondary">Cód: {p.code}</p>

            {/* Specs */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-black/10 py-6 sm:grid-cols-3">
              <Spec label="Área" value={`${p.area} m²`} show={p.area > 0} />
              <Spec label="Dormitórios" value={p.bedrooms} show={p.bedrooms > 0} />
              <Spec label="Suítes" value={p.suites} show={p.suites > 0} />
              <Spec label="Banheiros" value={p.bathrooms} show={p.bathrooms > 0} />
              <Spec label="Vagas" value={p.parking} show={p.parking > 0} />
            </div>

            {/* Sobre */}
            {p.description && (
              <section className="mt-8">
                <h2 className="mb-3 font-poppins text-lg font-semibold text-ink">Sobre o imóvel</h2>
                <p className="whitespace-pre-line leading-relaxed text-ink-secondary">{p.description}</p>
              </section>
            )}

            {/* Instalações do imóvel */}
            {p.features.length > 0 && (
              <FeatureList title="Instalações do imóvel" items={p.features} />
            )}
            {/* Instalações do condomínio */}
            {p.condoFeatures.length > 0 && (
              <FeatureList title="Instalações do condomínio" items={p.condoFeatures} />
            )}
          </div>

          {/* Coluna lateral: preço + CTA */}
          <aside className="lg:sticky lg:top-[100px] lg:self-start">
            <div className="rounded-xl bg-surface-alt p-6">
              {p.price > 0 && (
                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                  <span className="text-sm text-ink-muted">Total para compra</span>
                  <span className="font-poppins text-xl font-bold text-ink">{formatBRL(p.price)}</span>
                </div>
              )}
              {p.rentPrice > 0 && (
                <div className="flex items-center justify-between border-b border-black/10 py-4">
                  <span className="text-sm text-ink-muted">Aluguel / mês</span>
                  <span className="font-poppins text-xl font-bold text-ink">{formatBRL(p.rentPrice)}</span>
                </div>
              )}
              {(p.condo > 0 || p.iptu > 0) && (
                <p className="mt-3 text-xs text-ink-muted">
                  {p.condo > 0 && <>Condomínio: {formatBRL(p.condo)} · </>}
                  {p.iptu > 0 && <>IPTU: {formatBRL(p.iptu)}</>}
                </p>
              )}

              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1DAF54]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.585 0 11.946-5.359 11.949-11.893a11.821 11.821 0 00-3.481-8.413z"/></svg>
                Falar com {brokerName || "o corretor"}
              </a>
            </div>
          </aside>
        </div>
      </div>

      <Footer brand={c.brand} contact={c.contact} footer={c.footer} />
      <WhatsAppFloat contact={c.contact} />
    </main>
  );
}

function Spec({ label, value, show }) {
  if (!show) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="text-ink-secondary">{value}</p>
    </div>
  );
}

function FeatureList({ title, items }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 font-poppins text-lg font-semibold text-ink">{title}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-ink-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary-dark))" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            {f}
          </li>
        ))}
      </ul>
    </section>
  );
}
