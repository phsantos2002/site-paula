import { getContent } from "@/lib/content";
import { getProperties } from "@/lib/properties";
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
  const all = await getProperties();
  const featured = all.filter((p) => p.featured).slice(0, 8);
  const coverProperties = all.filter((p) => p.cover);

  return (
    <main className="overflow-x-hidden">
      <ThemeStyle colors={c.colors} />
      <Header brand={c.brand} contact={c.contact} nav={c.nav} header={c.header} />
      <Hero hero={c.hero} coverProperties={coverProperties} />
      <CorpRibbon ribbon={c.ribbon} />
      <AboutSection about={c.about} contact={c.contact} />
      <FeaturedCarousel properties={featured} featured={c.featured} />
      <CitiesSection cities={c.cities} />
      <RegisterForm register={c.register} />
      <Footer brand={c.brand} contact={c.contact} footer={c.footer} />
      <WhatsAppFloat contact={c.contact} />
    </main>
  );
}
