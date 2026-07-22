import { formatBRL } from "./format";

// Nome do corretor a partir da marca (ex.: "Paula Regina").
export function brokerNameOf(brand) {
  return [brand?.name, brand?.nameHighlight].filter(Boolean).join(" ").trim();
}

// Mensagem já preenchida com os dados do imóvel (usada na CTA do card e da página).
export function waMessageForProperty(brand, p, url) {
  const brokerName = brokerNameOf(brand);
  const priceLine =
    p.price > 0 ? `Valor: ${formatBRL(p.price)}` :
    p.rentPrice > 0 ? `Aluguel: ${formatBRL(p.rentPrice)}/mês` : "";
  const locationLine = [p.neighborhood, p.city && `${p.city}${p.state ? `/${p.state}` : ""}`].filter(Boolean).join(" - ");
  const detailLines = [p.title, `Código: ${p.code}`, locationLine && `Local: ${locationLine}`, priceLine].filter(Boolean);
  return [
    `Olá${brokerName ? ` ${brokerName}` : ""}, tenho interesse neste imóvel:`,
    "",
    ...detailLines,
    "",
    url,
  ].join("\n");
}

// Link wa.me completo para um imóvel. baseUrl = origem do site (para incluir o link do imóvel).
export function waLinkForProperty(contact, brand, p, baseUrl = "") {
  const url = `${baseUrl}/imovel/${p.slug}`;
  return `https://wa.me/${contact?.whatsapp || ""}?text=${encodeURIComponent(waMessageForProperty(brand, p, url))}`;
}
