"use client";

import { useEffect } from "react";

// Baixa uma imagem para o cache do navegador (sem renderizar).
export function preloadImage(src) {
  if (!src || typeof window === "undefined") return;
  const im = new window.Image();
  im.decoding = "async";
  im.src = src;
}

export function preloadAll(imgs) {
  (imgs || []).forEach(preloadImage);
}

// Pré-carrega as imagens VIZINHAS (anterior e próxima) para trocar sem atraso.
export function usePreloadAround(imgs, i) {
  useEffect(() => {
    const list = imgs || [];
    if (list.length < 2) return;
    const n = list.length;
    preloadImage(list[(i + 1) % n]);
    preloadImage(list[(i - 1 + n) % n]);
  }, [imgs, i]);
}
