/** Formatação de moeda BRL — seguro para client e server (sem fs). */
export function formatBRL(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
