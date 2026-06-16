const ICONS = {
  // área — cantos (tamanho)
  area: "M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3",
  // dormitórios — cama de casal
  bedrooms: "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M2 16h20",
  // suítes — cama + gota d'água (quarto com banheiro)
  suites: "M3 18v-5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5M3 15h11M3 18v1.5M14 18v1.5M5 11V9.5A1.5 1.5 0 0 1 6.5 8h4A1.5 1.5 0 0 1 12 9.5V11M19 4s2.2 2.8 2.2 4.4a2.2 2.2 0 0 1-4.4 0C16.8 6.8 19 4 19 4z",
  // banheiros — gota d'água
  bathrooms: "M12 3s5 5.3 5 9.3a5 5 0 0 1-10 0C7 8.3 12 3 12 3z",
  // vagas — carro
  parking: "M7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM21 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM5 17l1.4-6.1A2 2 0 0 1 8.3 9.3h7.4a2 2 0 0 1 1.9 1.6L19 17M3 13h18M7 17h10",
};

function Item({ icon, value, label, unit }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center gap-1.5 text-ink-secondary" title={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      <span className="text-sm">
        {value}
        {unit ? ` ${unit}` : ""}
      </span>
    </div>
  );
}

export default function PropertySpecs({ p, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
      {p.area > 0 && <Item icon={ICONS.area} value={p.area} unit="m²" label="Área" />}
      {p.bedrooms > 0 && <Item icon={ICONS.bedrooms} value={p.bedrooms} label="Dormitórios" />}
      {p.suites > 0 && <Item icon={ICONS.suites} value={p.suites} label="Suítes" />}
      {p.bathrooms > 0 && <Item icon={ICONS.bathrooms} value={p.bathrooms} label="Banheiros" />}
      {p.parking > 0 && <Item icon={ICONS.parking} value={p.parking} label="Vagas" />}
    </div>
  );
}
