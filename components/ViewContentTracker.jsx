"use client";

import { useEffect, useRef } from "react";
import { metaTrack } from "@/components/metaTrack";

// Dispara ViewContent (Pixel + CAPI) uma vez ao abrir a página de um imóvel.
// Usado para remarketing: reanunciar para quem viu um imóvel específico.
export default function ViewContentTracker({ id, name, value, currency = "BRL" }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const customData = { content_type: "product", currency };
    if (id) customData.content_ids = [String(id)];
    if (name) customData.content_name = name;
    if (Number(value) > 0) customData.value = Number(value);
    metaTrack("ViewContent", { customData });
  }, [id, name, value, currency]);
  return null;
}
