import { readJson, writeJson } from "./store";

/** Conteúdo padrão — fonte da verdade quando o JSON não existe ou está parcial. */
export const DEFAULT_CONTENT = {
  brand: {
    name: "Paula",
    nameHighlight: "Regina",
    tagline: "Corretora de Imóveis",
  },
  colors: {
    primary: "#F6BC41",
    primaryHover: "#F1CD80",
    primaryDark: "#EFB810",
    primaryBadge: "#EAB83D",
  },
  nav: [
    { label: "Cadastre seu Imóvel", href: "/#cadastro" },
    { label: "Imóveis", href: "/imoveis" },
    { label: "Sobre", href: "/#sobre" },
  ],
  header: {
    faleConosco: "Fale Conosco",
  },
  hero: {
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80",
    titleLine1: "O imóvel que você quer.",
    titleLine2: "Com a experiência que você sempre quis.",
    cardBadge: "Imóvel em destaque",
    cardButton: "Ver imóvel",
    coverInterval: 7,
  },
  contact: {
    whatsapp: "5512996762701",
    phoneDisplay: "(12) 99676-2701",
    creci: "272295",
    email: "",
    instagram: "",
    facebook: "",
    city: "SJC",
  },
  ribbon: [
    { pre: "+", strong: "15 ANOS", post: "DE EXPERIÊNCIA" },
    { pre: "+", strong: "800 IMÓVEIS", post: "NEGOCIADOS" },
    { pre: "", strong: "ATENDIMENTO", post: "100% PESSOAL" },
  ],
  about: {
    photo: "/paula-regina.jpg",
    eyebrow: "Sobre a Paula",
    title: "Quem cuida do seu imóvel",
    titleHighlight: "do começo ao fim",
    text: "Sou a Paula Regina, corretora de imóveis (CRECI-SP 272295) com mais de 15 anos de experiência em São José dos Campos e região. Meu trabalho é entender o que você realmente precisa e conduzir cada etapa — da busca à assinatura — com transparência, agilidade e atendimento direto, sem intermediários.",
    buttonText: "Falar com a Paula",
    highlights: [
      { value: "+15", label: "anos de mercado" },
      { value: "+800", label: "imóveis negociados" },
      { value: "100%", label: "atendimento pessoal" },
    ],
  },
  featured: {
    heading: "Destaques em",
    headingHighlight: "imóveis",
    seeMore: "Ver mais",
  },
  cities: {
    heading: "São milhares de imóveis em",
    headingHighlight: "diversas cidades",
    groups: [
      { city: "São José dos Campos", items: ["Urbanova", "Vila Adyana", "Vila Ema", "Jardim Aquarius", "Jardim das Colinas", "Jardim Apolo", "Jardim Esplanada", "Jardim Satélite", "Parque Industrial", "Centro"] },
      { city: "Jacareí", items: ["Villa Branca", "Jardim Califórnia", "Jardim Santa Maria", "Cidade Salvador", "Jardim Paraíba", "Parque Meia Lua", "Centro"] },
      { city: "Caçapava", items: ["Vila Menino Jesus", "Jardim Julião", "Vila Antônio Augusto", "Caçapava Velha", "Bairro dos Eucaliptos", "Centro"] },
      { city: "Litoral Norte", items: ["Caraguatatuba", "São Sebastião", "Ubatuba", "Ilhabela"] },
    ],
  },
  register: {
    headingLine1: "Cadastre agora,",
    headingLine2: "e venda ou alugue seu imóvel",
    headingHighlight: "com agilidade",
    description: "Não deixe seu imóvel parado. Cadastre agora mesmo com a Paula Regina e tenha atendimento direto, sem intermediários.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    formTitle: "Fale com a Paula Regina",
    formSubtitle: "Preencha seus dados para começar",
    submitText: "Enviar",
    termsText: 'Ao clicar em "Enviar", afirmo que li e concordo com os Termos de Uso e Política de Privacidade.',
    successTitle: "Recebido! 🎉",
    successText: "Obrigada pelo contato. Em breve a Paula Regina falará com você.",
  },
  footer: {
    aboutText: "Atendimento personalizado em compra, venda e locação de imóveis em São José dos Campos e região.",
    attendanceTitle: "Atendimento",
    attendanceCity: "São José dos Campos / SP",
    attendanceRegion: "São José dos Campos e região",
    columns: [
      {
        title: "Institucional",
        links: [
          { label: "Sobre a Paula", href: "/#sobre" },
          { label: "Política de Privacidade", href: "#" },
          { label: "Termos e Condições de Uso", href: "#" },
          { label: "Trabalhe comigo", href: "/#cadastro" },
        ],
      },
      {
        title: "Aqui você encontra",
        links: [
          { label: "Imóveis à venda em SJC", href: "/imoveis?cidade=São José dos Campos" },
          { label: "Imóveis à venda em Jacareí", href: "/imoveis?cidade=Jacareí" },
          { label: "Apartamentos", href: "/imoveis?tipo=Apartamento" },
          { label: "Casas", href: "/imoveis?tipo=Casa" },
          { label: "Para alugar", href: "/imoveis?operacao=Aluguel" },
          { label: "Para comprar", href: "/imoveis?operacao=Venda" },
        ],
      },
    ],
  },
};

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

/** Merge profundo: objetos mesclam, arrays/escalares do override substituem. */
export function deepMerge(base, override) {
  if (!isObject(base)) return override;
  const out = { ...base };
  for (const key of Object.keys(override || {})) {
    const o = override[key];
    if (isObject(o) && isObject(base[key])) out[key] = deepMerge(base[key], o);
    else if (o !== undefined) out[key] = o;
  }
  return out;
}

export async function getContent() {
  const saved = await readJson("content", null);
  return deepMerge(DEFAULT_CONTENT, saved || {});
}

export async function saveContent(data) {
  const merged = deepMerge(DEFAULT_CONTENT, data);
  await writeJson("content", merged);
  return merged;
}

/** "#F6BC41" -> "246 188 65" (canais RGB p/ usar em CSS var com alpha do Tailwind). */
export function hexToChannels(hex) {
  if (!hex) return "0 0 0";
  let h = String(hex).trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return "0 0 0";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
