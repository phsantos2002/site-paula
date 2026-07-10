import { getContent } from "@/lib/content";
import { getPublishedProperties } from "@/lib/properties";
import ThemeStyle from "@/components/ThemeStyle";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CorpRibbon from "@/components/CorpRibbon";
import AboutSection from "@/components/AboutSection";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import CitiesSection from "@/components/CitiesSection";
import RegisterForm from "@/components/RegisterForm";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const dynamic = "force-dynamic";

export default async function Home() {
  const c = await getContent();
  const all = await getPublishedProperties();
  // Cada vitrine tem ordem própria (independente da ordem da listagem/array).
  const featured = all.filter((p) => p.featured).sort((a, b) => a.featuredOrder - b.featuredOrder).slice(0, 8);
  const coverProperties = all.filter((p) => p.cover).sort((a, b) => a.coverOrder - b.coverOrder);
  // Template ativo (aba Templates do admin). Hoje só o "classico" existe; quando novos
  // layouts entrarem, o branch de composição da home acontece a partir deste valor.
  const template = c.template || "classico";

  return (
    <main className="overflow-x-hidden" data-template={template}>
      <ThemeStyle colors={c.colors} />
      <Header brand={c.brand} contact={c.contact} nav={c.nav} header={c.header} />
      <Hero hero={c.hero} coverProperties={coverProperties} />

      {/* Botão só no mobile: ver todos os imóveis */}
      <div className="bg-white px-6 py-5 md:hidden">
        <a
          href="/imoveis"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-poppins text-base font-medium text-ink-cta transition-colors hover:bg-primary-hover"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Ver todos os imóveis
        </a>
      </div>

      <CorpRibbon ribbon={c.ribbon} />
      <AboutSection about={c.about} contact={c.contact} />
      <FeaturedCarousel properties={featured} featured={c.featured} />
      <CitiesSection cities={c.cities} properties={all} />
      <RegisterForm register={c.register} />
      <Footer brand={c.brand} contact={c.contact} footer={c.footer} />
      <WhatsAppFloat contact={c.contact} />
    </main>
  );
}
