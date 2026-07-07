"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/format";
import PropertySpecs from "./PropertySpecs";
import StatusBadge from "./StatusBadge";

function HeroCard({ p, badge, button }) {
  const img = p.coverImage || p.images?.[0];
  return (
    <a
      href={`/imovel/${p.slug}`}
      className="block w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform hover:-translate-y-1"
    >
      <div className="relative h-44 w-full overflow-hidden">
        {img && <img src={img} alt={p.title} className="h-full w-full object-cover" />}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <StatusBadge status={p.status} />
          {(p.operation || []).map((op) => (
            <span key={op} className="rounded bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              {op}
            </span>
          ))}
        </div>
      </div>
      <div className="p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-dark">{badge}</span>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{p.title}</h3>
        <p className="text-xs text-ink-muted">{p.neighborhood} · {p.city}</p>
        <div className="mt-2">
          {p.price > 0 && <p className="font-poppins text-lg font-bold text-ink">Total: {formatBRL(p.price)}</p>}
          {p.rentPrice > 0 && <p className="font-poppins text-base font-bold text-ink">Aluguel: {formatBRL(p.rentPrice)}<span className="text-xs font-normal text-ink-muted">/mês</span></p>}
        </div>
        <PropertySpecs p={p} className="mt-2 text-xs" />
        <span className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-ink-cta">{button}</span>
      </div>
    </a>
  );
}

export default function Hero({ hero = {}, coverProperties = [] }) {
  const slides = coverProperties || [];
  const has = slides.length > 0;
  const many = slides.length > 1;
  const [i, setI] = useState(0);

  // auto-avança no intervalo configurado (direita -> esquerda)
  const intervalMs = Math.max(2, Number(hero.coverInterval) || 7) * 1000;
  useEffect(() => {
    if (!many) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [many, slides.length, intervalMs]);

  const idx = has ? i % slides.length : 0;
  const current = has ? slides[idx] : null;
  const bg = current?.coverImage || current?.images?.[0] || hero.image;
  const go = (d) => setI((v) => (v + d + slides.length) % slides.length);

  return (
    <section className="relative flex min-h-[560px] w-full items-center overflow-hidden bg-ink md:min-h-[634px]">
      <img key={bg} src={bg} alt="Banner" className="hero-fade absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      <div className="relative z-10 w-full px-6 pt-[110px] pb-24 md:px-[60px] md:pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_auto]">
          <div className="text-center lg:text-left">
            <h1 className="mx-auto max-w-2xl font-poppins text-[28px] font-medium leading-[1.2] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.45)] md:text-hero lg:mx-0">
              {hero.titleLine1}
              <br />
              <strong className="font-bold">{hero.titleLine2}</strong>
            </h1>
          </div>

          {current && (
            <div className="flex justify-center lg:justify-end">
              <div key={current.id} className="hero-slide w-full max-w-sm">
                <HeroCard p={current} badge={hero.cardBadge} button={hero.cardButton} />
              </div>
            </div>
          )}
        </div>
      </div>

      {current && many && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">
          <button onClick={() => go(-1)} aria-label="Anterior" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white/15">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <div className="flex gap-1.5">
            {slides.map((_, d) => (
              <button key={d} onClick={() => setI(d)} aria-label={`Ir para ${d + 1}`} className={`h-2 w-2 rounded-full transition-colors ${d === idx ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
          <button onClick={() => go(1)} aria-label="Próximo" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white/15">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      )}
    </section>
  );
}
