function CityColumn({ city, items }) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-ink-secondary">{city}</h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((n) => (
          <li key={n}>
            <a
              href={`/imoveis?cidade=${encodeURIComponent(city)}&q=${encodeURIComponent(n)}`}
              className="text-sm uppercase tracking-wide text-ink transition-colors hover:text-primary hover:underline"
            >
              {n}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CitiesSection({ cities = {}, properties = [] }) {
  // Monta os grupos a partir dos imóveis cadastrados: cidade -> bairros únicos
  const map = new Map();
  for (const p of properties) {
    if (!p.city) continue;
    if (!map.has(p.city)) map.set(p.city, new Set());
    if (p.neighborhood) map.get(p.city).add(p.neighborhood);
  }
  const groups = [...map.entries()]
    .map(([city, set]) => ({
      city,
      items: [...set].sort((a, b) => a.localeCompare(b, "pt")),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "pt"));

  if (!groups.length) return null;

  return (
    <section className="flex flex-col gap-10 bg-white px-6 py-14 pb-20 md:px-[60px]">
      <h2 className="font-poppins text-2xl font-medium uppercase text-ink-secondary">
        {cities.heading} <strong className="font-bold">{cities.headingHighlight}</strong>
      </h2>

      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <CityColumn key={g.city} city={g.city} items={g.items} />
        ))}
      </div>
    </section>
  );
}
