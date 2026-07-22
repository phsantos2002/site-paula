"use client";

import { useRef, useState } from "react";
import { formatBRL } from "@/lib/format";
import PropertySpecs from "./PropertySpecs";
import StatusBadge, { StatusRibbon } from "./StatusBadge";
import { preloadAll } from "@/components/imagePreload";
import { brokerNameOf, waLinkForProperty } from "@/lib/whatsapp";

// Logo oficial do WhatsApp (glyph único).
const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.585 0 11.946-5.359 11.949-11.893a11.821 11.821 0 00-3.481-8.413z";

function WhatsAppButton({ href, label, className = "" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1DAF54] ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={WA_PATH} /></svg>
      {label}
    </a>
  );
}

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

export default function PropertyCard({ p, variant = "list", contact, brand, baseUrl = "" }) {
  const href = `/imovel/${p.slug}`;
  const waLink = contact?.whatsapp ? waLinkForProperty(contact, brand, p, baseUrl) : "";
  const waLabel = `Falar com ${brokerNameOf(brand) || "a corretora"}`;

  if (variant === "grid") {
    return (
      <div className="flex min-w-[280px] max-w-[300px] snap-start flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-lg">
        <a href={href} className="block">
          <div className="relative">
            <Badges operation={p.operation} status={p.status} />
            <Gallery images={p.images} alt={p.title} heightClass="h-44" status={p.status} />
          </div>
          <div className="flex flex-col gap-1 p-4 pb-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-ink">{p.title}</h3>
            <p className="text-xs text-ink-muted">{p.neighborhood} · {p.city}</p>
            <div className="mt-1"><PriceBlock p={p} /></div>
            <PropertySpecs p={p} className="mt-2 text-xs" />
          </div>
        </a>
        {waLink && <div className="p-4 pt-3"><WhatsAppButton href={waLink} label={waLabel} /></div>}
      </div>
    );
  }

  // variant "list" — card horizontal
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white transition-shadow hover:shadow-lg md:flex-row">
      <a href={href} className="relative block md:w-[360px] md:shrink-0">
        <Badges operation={p.operation} status={p.status} />
        <Gallery images={p.images} alt={p.title} heightClass="h-56 md:h-full" status={p.status} />
      </a>
      <div className="flex flex-1 flex-col overflow-hidden p-5">
        <a href={href} className="flex flex-col gap-1.5">
          <h3 className="line-clamp-2 font-poppins text-base font-semibold leading-snug text-ink">{p.title}</h3>
          <p className="text-sm text-ink-muted">{p.type}</p>
          <PriceBlock p={p} />
          <p className="text-sm font-semibold text-ink-secondary">{p.neighborhood}</p>
          <p className="text-xs text-ink-muted">{p.city}, {p.state}</p>
          <PropertySpecs p={p} className="mt-2" />
        </a>
        {waLink && <WhatsAppButton href={waLink} label={waLabel} className="mt-5 w-full md:mt-6 md:w-auto md:self-start" />}
      </div>
    </div>
  );
}
