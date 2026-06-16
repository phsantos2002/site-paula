"use client";

import { useState } from "react";

export default function PropertyGallery({ images = [], alt }) {
  const imgs = images.length
    ? images
    : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80"];
  const [i, setI] = useState(0);
  const go = (d) => setI((v) => (v + d + imgs.length) % imgs.length);

  return (
    <div>
      <div className="relative h-[300px] w-full overflow-hidden rounded-xl md:h-[460px]">
        <img src={imgs[i]} alt={alt} className="h-full w-full object-cover" />
        {imgs.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Anterior" className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-2 text-ink shadow hover:bg-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button onClick={() => go(1)} aria-label="Próxima" className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-2 text-ink shadow hover:bg-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
              {i + 1} / {imgs.length}
            </span>
          </>
        )}
      </div>

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
    </div>
  );
}
