// Badge de situação do imóvel — renderizado a partir do campo `status`.
// Reaproveita o visual da pílula de operação, dentro da paleta atual (sem cor nova).
const STATUS_BADGE = {
  vendido: { label: "VENDIDO", className: "bg-ink text-white" },
  alugado: { label: "ALUGADO", className: "bg-ink text-white" },
  exclusividade: { label: "EXCLUSIVIDADE", className: "bg-primary text-ink-cta" },
  // "disponivel" (e qualquer outro) não gera badge.
};

export default function StatusBadge({ status, className = "" }) {
  const s = STATUS_BADGE[status];
  if (!s) return null;
  return (
    <span className={`rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${s.className} ${className}`}>
      {s.label}
    </span>
  );
}
