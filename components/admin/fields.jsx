"use client";

/* Componentes de formulário e upload de imagens compartilhados pelas abas do painel
   (extraídos do AdminForm.jsx). */

import { useState } from "react";

// Reduz/recomprime imagens que o navegador consegue decodificar (jpeg/png/webp),
// para caber no limite de upload e carregar rápido no site.
export async function compressImage(file) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type || "")) return file;
  if (file.size < 1_200_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1920;
    let { width, height } = bitmap;
    if (width > maxDim || height > maxDim) {
      const r = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * r);
      height = Math.round(height * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    if (blob && blob.size < file.size) {
      const base = (file.name || "foto").replace(/\.\w+$/, "");
      return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    }
  } catch {
    /* formato não decodificável (HEIC/DNG/RAW): envia original */
  }
  return file;
}

// Converte HEIC/HEIF (padrão de foto do iPhone) para JPG no navegador — Chrome e o site
// não exibem HEIC. Tenta a biblioteca (carregada sob demanda); se o navegador decodificar
// nativamente (Safari), usa canvas; senão, avisa para enviar em JPG.
export async function heicToJpeg(file) {
  const isHeic = /image\/hei[cf]/i.test(file.type || "") || /\.hei[cf]$/i.test(file.name || "");
  if (!isHeic) return file;
  const base = (file.name || "foto").replace(/\.\w+$/, "");
  try {
    const mod = await import("heic2any");
    const heic2any = mod.default || mod;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.88 });
    const blob = Array.isArray(out) ? out[0] : out;
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.88));
      if (blob) return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    } catch { /* sem conversão no navegador */ }
    // Envia o original: o SERVIDOR converte HEIC -> JPG no upload (garantia final).
    return file;
  }
}

export async function uploadImage(file) {
  const jpegReady = await heicToJpeg(file); // iPhone (HEIC) vira JPG antes de tudo
  const prepared = await compressImage(jpegReady);
  const fd = new FormData();
  fd.append("file", prepared);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (res.status === 413) {
    throw new Error("Imagem muito grande (máx ~4,5 MB). Use JPG/PNG ou reduza o tamanho.");
  }
  const j = await res.json().catch(() => ({}));
  if (!j.ok) throw new Error(j.error || `Falha no upload (HTTP ${res.status})`);
  return j.path;
}


export function MultiImageField({ images, onChange, coverImage, showCover, onSetCover, zipName }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");
  const [zipBusy, setZipBusy] = useState(false);
  async function downloadZip() {
    setZipBusy(true);
    try {
      const res = await fetch("/api/admin/zip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images, name: zipName }) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); alert(j.error || "Não foi possível gerar o ZIP."); setZipBusy(false); return; }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${zipName || "imovel"}-fotos.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch { alert("Erro ao baixar as fotos."); }
    setZipBusy(false);
  }
  async function handleFiles(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setBusy(true);
    setErr("");
    try {
      const paths = [];
      for (const f of files) paths.push(await uploadImage(f));
      onChange([...images, ...paths]);
    } catch (e2) {
      setErr(e2?.message || "Falha ao enviar imagem.");
    }
    setBusy(false);
    e.target.value = "";
  }
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = images.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };
  return (
    <div className="min-w-0">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-secondary">Fotos do imóvel <span className="font-normal text-ink-muted">(a 1ª é a principal no site · use ‹ › para ordenar)</span></span>
        {zipName && images.length > 0 && (
          <button type="button" onClick={downloadZip} disabled={zipBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:bg-black/5 disabled:opacity-60">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            {zipBusy ? "Gerando ZIP..." : `Baixar todas (.zip · ${images.length})`}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((src, idx) => {
          const isCover = showCover && coverImage === src;
          return (
            <div key={idx} className={`relative h-24 w-32 overflow-hidden rounded-lg border-2 ${isCover ? "border-primary" : "border-black/10"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 flex items-center gap-0.5">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} title="Mover para trás" className="flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white disabled:opacity-30">‹</button>
                <button onClick={() => move(idx, 1)} disabled={idx === images.length - 1} title="Mover para frente" className="flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white disabled:opacity-30">›</button>
                <span className="rounded-full bg-black/70 px-1.5 text-[10px] font-semibold text-white">{idx + 1}</span>
              </span>
              <button onClick={() => onChange(images.filter((_, j) => j !== idx))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white">×</button>
              {showCover && (
                <button
                  onClick={() => onSetCover(src)}
                  className={`absolute bottom-0 left-0 right-0 py-0.5 text-center text-[10px] font-semibold ${isCover ? "bg-primary text-ink-cta" : "bg-black/60 text-white hover:bg-black/80"}`}
                >
                  {isCover ? "★ foto de capa" : "Definir capa"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
        <input type="file" accept="image/*,.dng,.heic,.heif,.tif,.tiff,.webp,.avif,.cr2,.cr3,.nef,.arw,.raf,.rw2,.orf,.raw" multiple onChange={handleFiles} className="w-full max-w-full text-sm text-ink-secondary file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:text-white" />
        {busy && <span className="text-xs text-ink-muted">Enviando...</span>}
      </div>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <div className="mt-2 flex min-w-0 gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ou cole uma URL de imagem" className="h-9 min-w-0 flex-1 rounded-lg border border-inputborder px-2 text-xs outline-none focus:border-primary" />
        <button onClick={() => { if (url.trim()) { onChange([...images, url.trim()]); setUrl(""); } }} className="shrink-0 rounded-lg bg-black/5 px-3 text-sm hover:bg-black/10">Adicionar</button>
      </div>
    </div>
  );
}

/* ===================== Helpers de campo ===================== */

export function linesToArray(v) {
  return v.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-6">
      <h2 className="mb-4 font-poppins text-lg font-semibold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <input value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary focus:shadow-focus" />
    </label>
  );
}

// Campo para segredos (token). Mascarado por padrão, com botão mostrar/ocultar.
// Campo para segredos (token/URL). NÃO usa type="password" de propósito: isso evita que o
// navegador preencha automaticamente a SENHA do login do admin aqui. Em vez disso é um
// input de texto mascarado por CSS (bolinhas), com o toggle mostrar/ocultar.
export function SecretField({ label, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <div className="relative">
        <input
          type="text"
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          name="config-secret"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          style={{ WebkitTextSecurity: show ? "none" : "disc" }}
          className="h-11 w-full rounded-lg border border-inputborder pl-3 pr-16 text-sm outline-none focus:border-primary focus:shadow-focus"
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-ink-secondary hover:bg-black/5">
          {show ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </label>
  );
}

export function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <input type="number" min="0" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}

export function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function DriveLinkField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-sm font-medium text-ink-secondary">
        {label}
        {value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-normal text-primary-dark underline hover:text-primary">abrir ↗</a>
        ) : null}
      </span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Cole o link do Drive" className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary focus:shadow-focus" />
    </label>
  );
}

export function LabeledSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Mini({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-muted">{label}</span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}

export function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <textarea value={value || ""} rows={4} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-inputborder px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-focus" />
    </label>
  );
}

export function ColorField({ label, hint, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <span className="block text-sm font-medium text-ink-secondary">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>}
      </div>
      <span className="flex shrink-0 items-center gap-2 pt-0.5">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-inputborder" />
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="h-9 w-24 rounded-lg border border-inputborder px-2 text-sm uppercase outline-none focus:border-primary" />
      </span>
    </div>
  );
}

export function ImageField({ label, value, onChange, compact }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr("");
    try { onChange(await uploadImage(file)); } catch (e2) { setErr(e2?.message || "Falha ao enviar imagem."); }
    setBusy(false);
  }
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <div className="flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="preview" className={`rounded-lg object-cover ${compact ? "h-12 w-16" : "h-20 w-28"}`} />
        ) : (<div className={`rounded-lg bg-black/5 ${compact ? "h-12 w-16" : "h-20 w-28"}`} />)}
        <div className="flex-1">
          <input type="file" accept="image/*,.dng,.heic,.heif,.tif,.tiff,.webp,.avif,.cr2,.cr3,.nef,.arw,.raf,.rw2,.orf,.raw" onChange={handle} className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:text-white" />
          <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="ou cole uma URL de imagem" className="mt-2 h-9 w-full rounded-lg border border-inputborder px-2 text-xs outline-none focus:border-primary" />
          {busy && <p className="mt-1 text-xs text-ink-muted">Enviando...</p>}
          {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        </div>
      </div>
    </div>
  );
}

/* Editor de lista de links {label, href} */
export function LinkEditor({ items = [], onChange }) {
  return (
    <ArrayEditor items={items} onChange={onChange} empty={{ label: "", href: "" }} render={(item, upd) => (
      <div className="grid grid-cols-2 gap-2">
        <Mini label="Texto" value={item.label} onChange={(v) => upd({ ...item, label: v })} />
        <Mini label="Link (href)" value={item.href} onChange={(v) => upd({ ...item, href: v })} />
      </div>
    )} />
  );
}

/* Editor genérico de lista */
export function ArrayEditor({ items = [], onChange, render, empty }) {
  function update(i, newItem) { const next = items.slice(); next[i] = newItem; onChange(next); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function add() { onChange([...items, JSON.parse(JSON.stringify(empty))]); }
  function move(i, dir) { const j = i + dir; if (j < 0 || j >= items.length) return; const next = items.slice(); [next[i], next[j]] = [next[j], next[i]]; onChange(next); }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">#{i + 1}</span>
            <span className="flex gap-1">
              <button onClick={() => move(i, -1)} className="rounded px-2 py-0.5 text-xs text-ink-secondary hover:bg-black/10">↑</button>
              <button onClick={() => move(i, 1)} className="rounded px-2 py-0.5 text-xs text-ink-secondary hover:bg-black/10">↓</button>
              <button onClick={() => remove(i)} className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">Remover</button>
            </span>
          </div>
          {render(item, (ni) => update(i, ni))}
        </div>
      ))}
      <button onClick={add} className="rounded-lg border border-dashed border-ink-muted px-4 py-2 text-sm text-ink-secondary hover:bg-black/5">+ Adicionar</button>
    </div>
  );
}
