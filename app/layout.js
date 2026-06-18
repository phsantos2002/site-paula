import { Poppins } from "next/font/google";
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

export const metadata = {
  title: "Paula Regina | Corretora de Imóveis em São José dos Campos",
  description:
    "Encontre o imóvel que você quer com a experiência que você sempre quis. Atendimento personalizado em São José dos Campos e região.",
  openGraph: {
    title: "Paula Regina | Corretora de Imóveis",
    description:
      "O imóvel que você quer, com a experiência que você sempre quis.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
