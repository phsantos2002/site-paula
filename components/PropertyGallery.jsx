"use client";

import { useEffect, useState } from "react";
import { usePreloadAround } from "@/components/imagePreload";

export default function PropertyGallery({ images = [], alt }) {
  const imgs = images.length
    ? images
    : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80"];
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const go = (d) => setI((v) => (v + d + imgs.length) % imgs.length);
  usePreloadAround(imgs, i); // deixa a próxima/anterior prontas (troca sem atraso)

  // teclado quando o lightbox está aberto
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, imgs.length]);

  return (
    <div>
      {/* Imagem principal — clique abre em tela cheia */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-xl md:h-[460px]">
        <img
          src={imgs[i]}
          alt={alt}
          onClick={() => setOpen(true)}
          decoding="async"
          className="h-full w-full cursor-zoom-in object-cover"
        />
        {imgs.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Anterior" className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-2 text-ink shadow hover:bg-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button onClick={() => go(1)} aria-label="Próxima" className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-2 text-ink shadow hover:bg-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </>
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          {i + 1} / {imgs.length}
        </span>
      </div>

      {/* Miniaturas */}
      {imgs.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {imgs.map((src, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${idx === i ? "border-primary" : "border-transparent"}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox em tela cheia — imagem original, sem corte */}
      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>

          <span className="absolute top-5 left-1/2 -translate-x-1/2 rounded bg-white/15 px-3 py-1 text-sm text-white">
            {i + 1} / {imgs.length}
          </span>

          {/* a imagem não fecha ao clicar nela */}
          <img
            src={imgs[i]}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] object-contain"
          />

          {imgs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Anterior"
                className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 md:left-6"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Próxima"
                className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 md:right-6"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
