"use client";

import { useMemo, useState } from "react";
import PropertyCard from "./PropertyCard";

const SORTS = [
  { id: "recent", label: "Ordem do site" },
  { id: "price-asc", label: "Menor preço" },
  { id: "price-desc", label: "Maior preço" },
  { id: "area-desc", label: "Maior área" },
];

function priceOf(p) {
  return p.price > 0 ? p.price : p.rentPrice;
}

export default function PropertySearch({ properties = [], cities = [], types = [], initial = {}, contact, brand, baseUrl = "" }) {
  const [q, setQ] = useState(initial.q || "");
  const [city, setCity] = useState(initial.city || "");
  const [operation, setOperation] = useState(initial.operation || "");
  const [type, setType] = useState(initial.type || "");
  const [bedrooms, setBedrooms] = useState(0);
  const [parking, setParking] = useState(0);
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("recent");
  // Filtros começam RECOLHIDOS (o cliente vinha do anúncio e via só filtros). No mobile
  // aparecem via botão; no desktop ficam sempre visíveis na lateral (não empurram nada).
  const [showFilters, setShowFilters] = useState(false);
  const activeCount = [q, city, operation, type, bedrooms > 0, parking > 0, areaMin, areaMax, priceMin, priceMax].filter(Boolean).length;

  function clearAll() {
    setQ(""); setCity(""); setOperation(""); setType("");
    setBedrooms(0); setParking(0); setAreaMin(""); setAreaMax(""); setPriceMin(""); setPriceMax("");
  }

  const filtered = useMemo(() => {
    let list = properties.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.neighborhood} ${p.city} ${p.code}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (city && p.city !== city) return false;
      if (operation && !p.operation.includes(operation)) return false;
      if (type && p.type !== type) return false;
      if (bedrooms && p.bedrooms < bedrooms) return false;
      if (parking && p.parking < parking) return false;
      if (areaMin && p.area < Number(areaMin)) return false;
      if (areaMax && p.area > Number(areaMax)) return false;
      if (priceMin && priceOf(p) < Number(priceMin)) return false;
      if (priceMax && priceOf(p) > Number(priceMax)) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === "price-desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === "area-desc") list = [...list].sort((a, b) => b.area - a.area);
    return list;
  }, [properties, q, city, operation, type, bedrooms, parking, areaMin, areaMax, priceMin, priceMax, sort]);

  return (
    <div className="px-6 py-8 md:px-[60px]">
      {/* Breadcrumb + título */}
      <p className="text-sm text-ink-muted">
        <a href="/" className="hover:text-primary-dark">Início</a> › Buscar imóveis
      </p>
      <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <h1 className="font-poppins text-2xl text-ink-secondary">
          <strong className="font-bold text-primary-dark">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
        </h1>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          Ordenar por:
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-inputborder px-3 py-2 text-sm text-ink outline-none focus:border-primary">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* Botão de Filtros — só no mobile; recolhido por padrão para ver os imóveis de cara */}
      <button
        onClick={() => setShowFilters((s) => !s)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3 text-sm font-semibold text-ink-secondary shadow-sm lg:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
        Filtros
        {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold text-ink-cta">{activeCount}</span>}
        <span className="text-[10px] opacity-70">{showFilters ? "▲" : "▼"}</span>
      </button>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Filtros — escondidos no mobile até tocar em "Filtros"; sempre visíveis no desktop */}
        <aside className={`${showFilters ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-72`}>
          <div className="space-y-5 rounded-xl border border-black/10 bg-white p-5">
            <div className="flex items-center gap-2 rounded-lg border border-inputborder px-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Digite o Bairro, o Condomínio ou o Código" className="h-11 w-full bg-transparent text-sm outline-none" />
            </div>

            <Group label="Cidade">
              <Select value={city} onChange={setCity} options={["", ...cities]} labels={{ "": "Todas" }} />
            </Group>
            <Group label="Operação">
              <Select value={operation} onChange={setOperation} options={["", "Venda", "Aluguel"]} labels={{ "": "Todas" }} />
            </Group>
            <Group label="Tipo de Imóvel">
              <Select value={type} onChange={setType} options={["", ...types]} labels={{ "": "Selecione" }} />
            </Group>

            <Group label="Dormitórios">
              <Stepper value={bedrooms} onChange={setBedrooms} />
            </Group>
            <Group label="Vagas">
              <Stepper value={parking} onChange={setParking} />
            </Group>

            <Group label="Área do imóvel (m²)">
              <div className="flex gap-2">
                <NumInput value={areaMin} onChange={setAreaMin} placeholder="Mínima" />
                <NumInput value={areaMax} onChange={setAreaMax} placeholder="Máxima" />
              </div>
            </Group>
            <Group label="Valor (R$)">
              <div className="flex gap-2">
                <NumInput value={priceMin} onChange={setPriceMin} placeholder="Mínimo" />
                <NumInput value={priceMax} onChange={setPriceMax} placeholder="Máximo" />
              </div>
            </Group>

            <button onClick={clearAll} className="w-full rounded-lg bg-black/5 py-2.5 text-sm font-medium text-ink-secondary hover:bg-black/10">
              Limpar filtros
            </button>
          </div>
        </aside>

        {/* Resultados */}
        <div className="flex-1 space-y-5">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-muted p-12 text-center text-ink-muted">
              Nenhum imóvel encontrado com esses filtros.
            </div>
          ) : (
            filtered.map((p) => <PropertyCard key={p.id} p={p} variant="list" contact={contact} brand={brand} baseUrl={baseUrl} />)
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, labels = {} }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm text-ink outline-none focus:border-primary">
      {options.map((o) => <option key={o} value={o}>{labels[o] ?? o}</option>)}
    </select>
  );
}

function NumInput({ value, onChange, placeholder }) {
  return (
    <input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary" />
  );
}

function Stepper({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-inputborder text-ink-secondary hover:border-primary">−</button>
      <span className="min-w-[2rem] text-center text-sm">{value === 0 ? "Todos" : `${value}+`}</span>
      <button onClick={() => onChange(value + 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-inputborder text-ink-secondary hover:border-primary">+</button>
    </div>
  );
}
