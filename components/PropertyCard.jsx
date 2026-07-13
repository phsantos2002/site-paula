"use client";

import { useRef, useState } from "react";
import { formatBRL } from "@/lib/format";
import PropertySpecs from "./PropertySpecs";
import StatusBadge, { StatusRibbon } from "./StatusBadge";
import { preloadAll } from "@/components/imagePreload";

function Badges({ operation, status }) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
      {/* vendido/alugado viram faixa diagonal; aqui a pílula fica só p/ exclusividade */}
      <StatusBadge status={status === "exclusividade" ? status : undefined} />
      {(operation || []).map((op) => (
        <span
          key={op}
          className="rounded bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
        >
          {op}
        </span>
      ))}
    </div>
  );
}

function Gallery({ images = [], alt, heightClass, status }) {
  const [i, setI] = useState(0);
  const preloaded = useRef(false);
  const imgs = images.length ? images : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80"];
  const go = (e, d) => {
    e.preventDefault();
    e.stopPropagation();
    setI((v) => (v + d + imgs.length) % imgs.length);
  };
  // Pré-carrega as demais fotos do card só ao passar o mouse (mantém a página leve).
  const warm = () => { if (!preloaded.current) { preloaded.current = true; preloadAll(imgs); } };
  return (
    <div onMouseEnter={warm} className={`group/gal relative w-full overflow-hidden ${heightClass}`}>
      <img src={imgs[i]} alt={alt} decoding="async" className="h-full w-full object-cover" />
      <StatusRibbon status={status} />
      {imgs.length > 1 && (
        <>
          <button onClick={(e) => go(e, -1)} aria-label="Anterior" className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-1.5 text-ink shadow group-hover/gal:flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button onClick={(e) => go(e, 1)} aria-label="Próxima" className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-1.5 text-ink shadow group-hover/gal:flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {imgs.map((_, idx) => (
              <span key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === i ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PriceBlock({ p }) {
  return (
    <div>
      {p.price > 0 && (
        <p className="font-poppins text-xl font-bold text-ink">
          Total: <span className="text-ink">{formatBRL(p.price)}</span>
        </p>
      )}
      {p.rentPrice > 0 && (
        <p className="font-poppins text-lg font-bold text-ink">
          Aluguel: {formatBRL(p.rentPrice)}
          <span className="text-sm font-normal text-ink-muted">/mês</span>
        </p>
      )}
      {(p.condo > 0 || p.iptu > 0) && (
        <p className="mt-0.5 text-xs text-ink-muted">
          {p.condo > 0 && <>Condomínio: {formatBRL(p.condo)} </>}
          {p.iptu > 0 && <>IPTU: {formatBRL(p.iptu)}</>}
        </p>
      )}
    </div>
  );
}

export default function PropertyCard({ p, variant = "list" }) {
  const href = `/imovel/${p.slug}`;

  if (variant === "grid") {
    return (
      <a href={href} className="block min-w-[280px] max-w-[300px] snap-start overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-lg">
        <div className="relative">
          <Badges operation={p.operation} status={p.status} />
          <Gallery images={p.images} alt={p.title} heightClass="h-44" status={p.status} />
        </div>
        <div className="flex flex-col gap-1 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-ink">{p.title}</h3>
          <p className="text-xs text-ink-muted">{p.neighborhood} · {p.city}</p>
          <div className="mt-1"><PriceBlock p={p} /></div>
          <PropertySpecs p={p} className="mt-2 text-xs" />
        </div>
      </a>
    );
  }

  // variant "list" — card horizontal
  return (
    <a href={href} className="flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white transition-shadow hover:shadow-lg md:h-[260px] md:flex-row">
      <div className="relative md:w-[360px] md:shrink-0">
        <Badges operation={p.operation} status={p.status} />
        <Gallery images={p.images} alt={p.title} heightClass="h-56 md:h-full" status={p.status} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 overflow-hidden p-5">
        <h3 className="line-clamp-2 font-poppins text-base font-semibold leading-snug text-ink">{p.title}</h3>
        <p className="text-sm text-ink-muted">{p.type}</p>
        <PriceBlock p={p} />
        <p className="text-sm font-semibold text-ink-secondary">{p.neighborhood}</p>
        <p className="text-xs text-ink-muted">{p.city}, {p.state}</p>
        <PropertySpecs p={p} className="mt-2" />
      </div>
    </a>
  );
}
