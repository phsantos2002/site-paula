import { Poppins } from "next/font/google";
import { siteUrl } from "@/lib/site";
import { getContent, seoFor } from "@/lib/content";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // não trava o zoom do usuário (acessibilidade); só evitamos o zoom de foco via CSS
};

export async function generateMetadata() {
  const content = await getContent();
  const seo = seoFor(content);
  const description = seo.description;
  const images = seo.ogImage ? [{ url: seo.ogImage, alt: seo.siteName }] : undefined;
  return {
    metadataBase: new URL(siteUrl()),
    title: seo.title,
    description,
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      title: seo.title,
      description,
      type: "website",
      locale: "pt_BR",
      siteName: seo.siteName,
      url: "/",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
