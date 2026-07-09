// Badge de situação do imóvel — renderizado a partir do campo `status`.
// Reaproveita o visual da pílula de operação, dentro da paleta atual (sem cor nova).
const STATUS_BADGE = {
  vendido: { label: "VENDIDO", className: "bg-ink text-white" },
  alugado: { label: "ALUGADO", className: "bg-ink text-white" },
  exclusividade: { label: "EXCLUSIVIDADE", className: "bg-primary text-ink-cta" },
  // "disponivel" (e qualquer outro) não gera badge.
};

export default function StatusBadge({ status, className = "", size = "md" }) {
  const s = STATUS_BADGE[status];
  if (!s) return null;
  const sz = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={`rounded font-semibold uppercase tracking-wide ${sz} ${s.className} ${className}`}>
      {s.label}
    </span>
  );
}

// Faixa diagonal no canto da foto para situações "fechadas" (vendido/alugado).
// Exige um contêiner pai com `position: relative` e `overflow: hidden` (o box da imagem).
const RIBBON_LABEL = { vendido: "VENDIDO", alugado: "ALUGADO" };

export function StatusRibbon({ status }) {
  const label = RIBBON_LABEL[status];
  if (!label) return null;
  return (
    <span className="pointer-events-none absolute right-[-40px] top-[18px] z-20 w-[150px] rotate-45 bg-[#ffa200] py-1 text-center text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
      {label}
    </span>
  );
}
