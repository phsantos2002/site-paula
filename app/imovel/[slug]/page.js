import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";
import { getProperty } from "@/lib/properties";
import { formatBRL } from "@/lib/format";
import ThemeStyle from "@/components/ThemeStyle";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import PropertyGallery from "@/components/PropertyGallery";
import PropertySpecs from "@/components/PropertySpecs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const p = await getProperty(params.slug);
  return { title: p ? `${p.title} | Paula Regina` : "Imóvel | Paula Regina" };
}

export default async function PropertyPage({ params }) {
  const c = await getContent();
  const p = await getProperty(params.slug);
  if (!p) notFound();

  const wa = `https://wa.me/${c.contact.whatsapp || ""}?text=${encodeURIComponent(
    `Olá Paula, tenho interesse no imóvel cód. ${p.code}: ${p.title}`
  )}`;

  return (
    <main className="min-h-screen bg-white">
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

              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-base font-medium text-white transition-colors hover:bg-ink-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.05 2C6.5 2 2 6.5 2 12.05c0 1.77.46 3.45 1.34 4.95L2 22l5.13-1.32a10 10 0 0 0 4.92 1.27c5.55 0 10.05-4.5 10.05-10.05S17.6 2 12.05 2z" /></svg>
                Falar com Paula Regina
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
