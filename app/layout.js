import { Poppins } from "next/font/google";
import { siteUrl } from "@/lib/site";
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

const description =
  "Encontre o imóvel que você quer com a experiência que você sempre quis. Atendimento personalizado em São José dos Campos e região.";

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Paula Regina | Corretora de Imóveis",
  description,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Paula Regina | Corretora de Imóveis",
    description: "O imóvel que você quer, com a experiência que você sempre quis.",
    type: "website",
    locale: "pt_BR",
    siteName: "Paula Regina — Corretora de Imóveis",
    url: "/",
    images: [{ url: "/paula-regina.jpg", alt: "Paula Regina — Corretora de Imóveis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paula Regina | Corretora de Imóveis",
    description,
    images: ["/paula-regina.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
