"use client";

import { useEffect, useState } from "react";

const TABS = [
  { id: "contatos", label: "Contatos", icon: "M22 5H2v14h20zM2 6l10 7 10-7" },
  { id: "imoveis", label: "Imóveis", icon: "M3 11l9-8 9 8M5 9.5V21h14V9.5" },
  { id: "capa", label: "Capa", icon: "M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M8 9a1 1 0 1 0 0 .01" },
  { id: "marca", label: "Marca & Cores", icon: "M20.6 12.6 12 4H4v8l8.6 8.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8zM7.5 7.5h.01" },
  { id: "menu", label: "Menu & Contato", icon: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z" },
  { id: "secoes", label: "Seções da Home", icon: "M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { id: "form", label: "Formulário", icon: "M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3M9 4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1M8 12h8M8 16h5" },
  { id: "rodape", label: "Rodapé", icon: "M3 4h18v16H3zM3 15h18" },
];

const OPERATIONS = ["Venda", "Aluguel", "Financiamento"];
const TYPES = ["Apartamento", "Casa", "Terreno", "Comercial"];

const STATUS_OPTIONS = [
  { value: "disponivel", label: "Disponível" },
  { value: "exclusividade", label: "Exclusividade" },
  { value: "vendido", label: "Vendido" },
  { value: "alugado", label: "Alugado" },
];
const ETAPA_OPTIONS = [
  { value: "captado", label: "1 · Captado" },
  { value: "fotos_drive", label: "2 · Fotos no Drive" },
  { value: "infos", label: "3 · Infos com a Paula" },
  { value: "no_site", label: "4 · No site" },
];
const ETAPA_LABEL = Object.fromEntries(ETAPA_OPTIONS.map((o) => [o.value, o.label]));

// Checklist de distribuição (marketing) — interno ao painel.
const DISTRIBUICAO_ITENS = [
  { key: "videoEditado", label: "Vídeo editado (Drive)" },
  { key: "carrossel", label: "Carrossel (Instagram)" },
  { key: "reels", label: "Reels (Instagram)" },
  { key: "anuncio", label: "Anúncio (Meta Ads)" },
];
function distribCount(p) {
  return DISTRIBUICAO_ITENS.filter((it) => p.distribuicao?.[it.key]).length;
}

// Reduz/recomprime imagens que o navegador consegue decodificar (jpeg/png/webp),
// para caber no limite de upload e carregar rápido no site.
async function compressImage(file) {
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

async function uploadImage(file) {
  const prepared = await compressImage(file);
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

export default function AdminForm({ initial, initialProperties = [], initialLeads = [] }) {
  const [data, setData] = useState(initial);
  const [properties, setProperties] = useState(initialProperties);
  const [leads, setLeads] = useState(initialLeads);
  const [tab, setTab] = useState("contatos");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // patch(section, key, value) -> data[section][key] = value (cobre objetos e arrays-valor)
  function patch(section, key, value) {
    setData((d) => ({ ...d, [section]: { ...d[section], [key]: value } }));
  }
  // setSection(section, value) -> data[section] = value (arrays de topo: nav, ribbon, services)
  function setSection(section, value) {
    setData((d) => ({ ...d, [section]: value }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/admin/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
        fetch("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ properties }) }),
        fetch("/api/admin/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leads }) }),
      ]);
      const j1 = await r1.json().catch(() => ({}));
      const j2 = await r2.json().catch(() => ({}));
      const j3 = await r3.json().catch(() => ({}));
      if (j1.ok && j2.ok && j3.ok) {
        if (j2.properties) setProperties(j2.properties);
        if (j3.leads) setLeads(j3.leads);
        setMsg({ type: "ok", text: "Tudo salvo! Atualize o site para ver." });
      } else {
        setMsg({ type: "err", text: j1.error || j2.error || j3.error || "Erro ao salvar." });
      }
    } catch {
      setMsg({ type: "err", text: "Erro de conexão." });
    }
    setSaving(false);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  // some o aviso de sucesso sozinho
  useEffect(() => {
    if (msg?.type === "ok") {
      const t = setTimeout(() => setMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  const unread = leads.filter((l) => !l.read).length;
  const badges = { contatos: unread || null, imoveis: properties.length || null };

  return (
    <div className="min-h-screen bg-[#f1f3f5] text-ink">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 font-poppins text-lg font-semibold">
            {data.brand?.name} <span className="text-primary-dark">{data.brand?.nameHighlight}</span>
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink-muted">Painel</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-black/5 sm:flex">
              Ver site
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </a>
            <button onClick={logout} className="rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-black/5">Sair</button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink-secondary disabled:opacity-60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" /></svg>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 lg:flex lg:gap-6">
        {/* Navegação: abas roláveis no mobile, sidebar no desktop */}
        <nav className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6 lg:mx-0 lg:mb-0 lg:w-60 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors lg:w-full ${active ? "bg-ink text-white shadow-sm" : "bg-white text-ink-secondary hover:bg-black/5 lg:bg-transparent"}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d={t.icon} />
                </svg>
                {t.label}
                {badges[t.id] != null && (
                  <span className={`ml-auto hidden rounded-full px-1.5 text-[11px] font-semibold lg:inline ${active ? "bg-white/25 text-white" : "bg-primary/20 text-primary-dark"}`}>
                    {badges[t.id]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {tab === "contatos" && <ContatosTab leads={leads} setLeads={setLeads} />}
          {tab === "imoveis" && <ImoveisTab properties={properties} setProperties={setProperties} />}
          {tab === "capa" && <CapaTab data={data} patch={patch} />}
          {tab === "marca" && <MarcaTab data={data} patch={patch} />}
          {tab === "menu" && <MenuTab data={data} patch={patch} setSection={setSection} />}
          {tab === "secoes" && <SecoesTab data={data} patch={patch} setSection={setSection} />}
          {tab === "form" && <FormTab data={data} patch={patch} />}
          {tab === "rodape" && <RodapeTab data={data} patch={patch} />}
        </div>
      </div>

      {/* Toast flutuante de status */}
      {msg && (
        <div className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${msg.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

/* ===================== CONTATOS (LEADS) ===================== */

function formatDate(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

function ContatosTab({ leads, setLeads }) {
  const unread = leads.filter((l) => !l.read).length;

  function toggleRead(i) {
    const next = leads.slice();
    next[i] = { ...next[i], read: !next[i].read };
    setLeads(next);
  }
  function remove(i) {
    if (!confirm("Excluir este contato?")) return;
    setLeads(leads.filter((_, idx) => idx !== i));
  }

  return (
    <Card title={`Contatos recebidos (${leads.length}${unread ? ` · ${unread} novo(s)` : ""})`}>
      <p className="-mt-2 mb-2 text-xs text-ink-muted">
        Mensagens enviadas pelo formulário do site. Lembre de clicar em <strong>Salvar alterações</strong> após marcar como lido ou excluir.
      </p>
      {leads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-muted p-8 text-center text-sm text-ink-muted">
          Nenhum contato recebido ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((l, i) => {
            const wa = l.telefone ? `https://wa.me/${String(l.telefone).replace(/\D/g, "")}` : null;
            return (
              <div key={l.id || i} className={`rounded-lg border p-4 ${l.read ? "border-black/10 bg-white" : "border-primary/40 bg-primary/5"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {l.nome || "(sem nome)"}{" "}
                      {!l.read && <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-ink-cta">NOVO</span>}
                    </p>
                    <p className="text-xs text-ink-muted">{formatDate(l.createdAt)} · Interesse: {l.tipo || "—"}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => toggleRead(i)} className="rounded border border-black/10 px-2.5 py-1 text-xs text-ink-secondary hover:bg-black/5">
                      {l.read ? "Marcar não lido" : "Marcar lido"}
                    </button>
                    <button onClick={() => remove(i)} className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">Excluir</button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-secondary">
                  {l.telefone && (
                    <span>📞 {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-dark">{l.telefone}</a> : l.telefone}</span>
                  )}
                  {l.email && <span>✉️ <a href={`mailto:${l.email}`} className="underline hover:text-primary-dark">{l.email}</a></span>}
                </div>
                {l.mensagem && <p className="mt-2 rounded bg-black/[0.03] p-2 text-sm text-ink-secondary">{l.mensagem}</p>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ===================== IMÓVEIS ===================== */

function nextCode(properties) {
  const max = properties.reduce((m, p) => {
    const n = parseInt(p.code, 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 1000);
  return String(max + 1);
}

function emptyProperty(code) {
  return {
    id: code, code, title: "", type: "Apartamento", operation: ["Venda"],
    city: "São José dos Campos", neighborhood: "", state: "SP",
    price: 0, rentPrice: 0, condo: 0, iptu: 0,
    area: 0, bedrooms: 0, suites: 0, bathrooms: 0, parking: 0,
    description: "", features: [], condoFeatures: [], images: [], featured: false,
    // Nasce como rascunho invisível no site (captação):
    status: "disponivel", etapa: "captado", publicado: false,
    condominio: "", andar: 0, mobiliado: false,
    proprietario: { nome: "", contato: "", exclusividade: false },
    captacao: { data: "", capturadoPor: "", observacoes: "" },
    driveLinks: { fotos: "", video: "" },
    distribuicao: { videoEditado: false, carrossel: false, reels: false, anuncio: false },
  };
}

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "rascunhos", label: "Rascunhos" },
  { value: "publicados", label: "Publicados" },
  ...ETAPA_OPTIONS,
  { value: "distrib_pendente", label: "Distribuição pendente" },
];

function ImoveisTab({ properties, setProperties }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [filter, setFilter] = useState("all");
  function isVisible(p) {
    if (filter === "all") return true;
    if (filter === "rascunhos") return !p.publicado;
    if (filter === "publicados") return !!p.publicado;
    if (filter === "distrib_pendente") return !!p.publicado && DISTRIBUICAO_ITENS.some((it) => !p.distribuicao?.[it.key]);
    return (p.etapa || "captado") === filter;
  }
  const visibleCount = properties.filter(isVisible).length;
  function togglePublish(i, p) {
    // Ao publicar, avança a etapa para "No site" automaticamente.
    update(i, { ...p, publicado: !p.publicado, etapa: !p.publicado ? "no_site" : p.etapa });
  }
  function update(i, np) { const next = properties.slice(); next[i] = np; setProperties(next); }
  async function migrateStatus() {
    if (!confirm("Isto lê os imóveis já salvos, move VENDIDO / EXCLUSIVIDADE / ALUGADO do título para o campo Situação e limpa os títulos (as URLs são preservadas).\n\nSalve suas alterações antes. Deseja continuar?")) return;
    setMigrating(true);
    try {
      const res = await fetch("/api/admin/migrate", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (j.ok) {
        setProperties(j.properties);
        alert(`Migração concluída: ${j.changed} de ${j.total} imóvel(is) ajustado(s).`);
      } else {
        alert(j.error || "Falha na migração.");
      }
    } catch {
      alert("Erro de conexão.");
    }
    setMigrating(false);
  }
  function remove(i) { if (!confirm("Excluir este imóvel?")) return; setProperties(properties.filter((_, idx) => idx !== i)); setOpenIdx(null); }
  function add() { const code = nextCode(properties); setProperties([emptyProperty(code), ...properties]); setOpenIdx(0); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= properties.length) return;
    const next = properties.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setProperties(next);
    if (openIdx === i) setOpenIdx(j);
    else if (openIdx === j) setOpenIdx(i);
  }

  return (
    <Card title={`Imóveis cadastrados (${properties.length})`}>
      <button onClick={add} className="mb-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-ink-cta hover:bg-primary-hover">+ Cadastrar novo imóvel</button>
      <p className="mb-4 text-xs text-ink-muted">Use as setas ↑ ↓ para reordenar. Essa ordem vale na <strong>capa</strong> e nos <strong>destaques</strong> da home.</p>

      {/* Manutenção única: extrai VENDIDO/EXCLUSIVIDADE/ALUGADO dos títulos para o campo Situação */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-black/15 bg-black/[0.02] p-3">
        <button
          onClick={migrateStatus}
          disabled={migrating}
          className="rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-ink-secondary hover:bg-black/5 disabled:opacity-60"
        >
          {migrating ? "Migrando..." : "Migrar títulos → Situação"}
        </button>
        <span className="text-xs text-ink-muted">
          Ação única: tira o “VENDIDO”/“EXCLUSIVIDADE” do texto do título e joga para o campo <strong>Situação</strong>. Pode rodar mais de uma vez sem problema.
        </span>
      </div>

      {/* Filtro por etapa do funil / publicação */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? "bg-ink text-white" : "bg-black/5 text-ink-secondary hover:bg-black/10"}`}
            >
              {f.label}
            </button>
          );
        })}
        <span className="ml-1 text-xs text-ink-muted">{visibleCount} de {properties.length}</span>
      </div>

      <div className="space-y-3">
        {visibleCount === 0 && (
          <div className="rounded-lg border border-dashed border-ink-muted p-8 text-center text-sm text-ink-muted">
            Nenhum imóvel neste filtro.
          </div>
        )}
        {properties.map((p, i) => {
          if (!isVisible(p)) return null;
          return (
          <div key={p.id || i} className="rounded-lg border border-black/10 bg-white">
            <div className="flex w-full items-center gap-3 px-4 py-3">
              {/* reordenar */}
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima" className="flex h-5 w-6 items-center justify-center rounded text-ink-muted hover:bg-black/5 disabled:opacity-30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 15l6-6 6 6" /></svg>
                </button>
                <button onClick={() => move(i, 1)} disabled={i === properties.length - 1} aria-label="Mover para baixo" className="flex h-5 w-6 items-center justify-center rounded text-ink-muted hover:bg-black/5 disabled:opacity-30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              </div>

              <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex flex-1 items-center gap-3 text-left">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="h-10 w-14 rounded object-cover" />
                ) : (<span className="h-10 w-14 rounded bg-black/5" />)}
                <span>
                  <span className="block text-sm font-medium text-ink">{p.title || "(sem título)"}</span>
                  <span className="block text-xs text-ink-muted">Cód: {p.code} · {p.type} · {(p.operation || []).join(", ")}</span>
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                {!p.publicado && <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">RASCUNHO</span>}
                <span className="hidden rounded bg-black/5 px-2 py-0.5 text-[10px] font-medium text-ink-muted sm:inline">{ETAPA_LABEL[p.etapa || "captado"]}</span>
                {p.publicado && <span className={`hidden rounded px-2 py-0.5 text-[10px] font-medium sm:inline ${distribCount(p) === DISTRIBUICAO_ITENS.length ? "bg-black/5 text-ink-muted" : "bg-primary/20 text-primary-dark"}`}>Distrib. {distribCount(p)}/{DISTRIBUICAO_ITENS.length}</span>}
                {p.cover && <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">CAPA</span>}
                {p.featured && <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary-dark">DESTAQUE</span>}
                <button
                  onClick={() => togglePublish(i, p)}
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${p.publicado ? "bg-black/5 text-ink-secondary hover:bg-black/10" : "bg-primary text-ink-cta hover:bg-primary-hover"}`}
                >
                  {p.publicado ? "Despublicar" : "Publicar"}
                </button>
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} aria-label="Abrir" className="text-ink-muted">{openIdx === i ? "▲" : "▼"}</button>
              </div>
            </div>
            {openIdx === i && (
              <div className="space-y-4 border-t border-black/10 p-4">
                <div className="rounded-lg bg-black/[0.03] p-3">
                  <span className="block text-sm font-semibold text-ink-secondary">Código do imóvel: <span className="text-primary-dark">{p.code}</span></span>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="flex items-start gap-2 rounded-md border border-black/10 bg-white p-2.5 text-sm text-ink-secondary">
                      <input type="checkbox" checked={!!p.cover} onChange={(e) => update(i, { ...p, cover: e.target.checked })} className="mt-0.5 h-4 w-4 accent-primary" />
                      <span>
                        <strong>🏠 Capa da home (topo)</strong>
                        <span className="block text-xs text-ink-muted">Aparece no carrossel grande do topo. Marque em 2+ imóveis para girar.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 rounded-md border border-black/10 bg-white p-2.5 text-sm text-ink-secondary">
                      <input type="checkbox" checked={!!p.featured} onChange={(e) => update(i, { ...p, featured: e.target.checked })} className="mt-0.5 h-4 w-4 accent-primary" />
                      <span>
                        <strong>⭐ Destaque</strong>
                        <span className="block text-xs text-ink-muted">Aparece na seção “Destaques em imóveis”, mais abaixo na home.</span>
                      </span>
                    </label>
                  </div>
                </div>
                {p.cover && (
                  <p className="-mt-2 text-xs text-primary-dark">
                    Este imóvel está na <strong>capa</strong>. Escolha abaixo a <strong>foto de capa</strong> (botão “Definir capa” numa foto).
                    O tempo de troca do carrossel é definido na aba “Capa”.
                  </p>
                )}
                {/* Ciclo de vida / publicação */}
                <div className="rounded-lg border border-black/10 bg-white p-3">
                  <span className="mb-2 block text-sm font-semibold text-ink-secondary">Situação & Publicação</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <LabeledSelect label="Situação (badge no site)" value={p.status || "disponivel"} options={STATUS_OPTIONS} onChange={(v) => update(i, { ...p, status: v })} />
                    <LabeledSelect label="Etapa (funil interno)" value={p.etapa || "captado"} options={ETAPA_OPTIONS} onChange={(v) => update(i, { ...p, etapa: v })} />
                  </div>
                  <label className="mt-3 flex items-start gap-2 rounded-md border border-black/10 bg-black/[0.02] p-2.5 text-sm text-ink-secondary">
                    <input type="checkbox" checked={!!p.publicado} onChange={(e) => update(i, { ...p, publicado: e.target.checked })} className="mt-0.5 h-4 w-4 accent-primary" />
                    <span>
                      <strong>{p.publicado ? "✅ Publicado no site" : "📝 Rascunho (não aparece no site)"}</strong>
                      <span className="block text-xs text-ink-muted">Desmarcado, o imóvel existe só aqui no painel. Marque para exibir na home e na listagem.</span>
                    </span>
                  </label>
                </div>

                <Field label="Título" value={p.title} onChange={(v) => update(i, { ...p, title: v })} placeholder="Ex: Casa à venda em SJC no bairro Urbanova - 4 quartos" />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Tipo" value={p.type} options={TYPES} onChange={(v) => update(i, { ...p, type: v })} />
                  <div>
                    <span className="mb-1 block text-sm font-medium text-ink-secondary">Operação</span>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {OPERATIONS.map((op) => (
                        <label key={op} className="flex items-center gap-1.5 text-sm text-ink-secondary">
                          <input type="checkbox" checked={(p.operation || []).includes(op)} onChange={(e) => { const set = new Set(p.operation || []); e.target.checked ? set.add(op) : set.delete(op); update(i, { ...p, operation: [...set] }); }} className="h-4 w-4 accent-primary" />
                          {op}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <Field label="Cidade" value={p.city} onChange={(v) => update(i, { ...p, city: v })} />
                  <Field label="Bairro" value={p.neighborhood} onChange={(v) => update(i, { ...p, neighborhood: v })} />
                  <Field label="UF" value={p.state} onChange={(v) => update(i, { ...p, state: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <NumberField label="Valor venda (R$)" value={p.price} onChange={(v) => update(i, { ...p, price: v })} />
                  <NumberField label="Valor aluguel (R$)" value={p.rentPrice} onChange={(v) => update(i, { ...p, rentPrice: v })} />
                  <NumberField label="Condomínio (R$)" value={p.condo} onChange={(v) => update(i, { ...p, condo: v })} />
                  <NumberField label="IPTU (R$)" value={p.iptu} onChange={(v) => update(i, { ...p, iptu: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <NumberField label="Área (m²)" value={p.area} onChange={(v) => update(i, { ...p, area: v })} />
                  <NumberField label="Dormitórios" value={p.bedrooms} onChange={(v) => update(i, { ...p, bedrooms: v })} />
                  <NumberField label="Suítes" value={p.suites} onChange={(v) => update(i, { ...p, suites: v })} />
                  <NumberField label="Banheiros" value={p.bathrooms} onChange={(v) => update(i, { ...p, bathrooms: v })} />
                  <NumberField label="Vagas" value={p.parking} onChange={(v) => update(i, { ...p, parking: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Field label="Condomínio (nome)" value={p.condominio} onChange={(v) => update(i, { ...p, condominio: v })} />
                  <NumberField label="Andar" value={p.andar} onChange={(v) => update(i, { ...p, andar: v })} />
                  <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-ink-secondary">
                    <input type="checkbox" checked={!!p.mobiliado} onChange={(e) => update(i, { ...p, mobiliado: e.target.checked })} className="h-4 w-4 accent-primary" />
                    Mobiliado
                  </label>
                </div>
                <TextArea label="Descrição (Sobre o imóvel)" value={p.description} onChange={(v) => update(i, { ...p, description: v })} />
                <TextArea label="Instalações do imóvel (uma por linha)" value={(p.features || []).join("\n")} onChange={(v) => update(i, { ...p, features: linesToArray(v) })} />
                <TextArea label="Instalações do condomínio (uma por linha)" value={(p.condoFeatures || []).join("\n")} onChange={(v) => update(i, { ...p, condoFeatures: linesToArray(v) })} />
                {/* Proprietário */}
                <div className="rounded-lg border border-black/10 bg-white p-3">
                  <span className="mb-2 block text-sm font-semibold text-ink-secondary">Proprietário</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nome" value={p.proprietario?.nome} onChange={(v) => update(i, { ...p, proprietario: { ...(p.proprietario || {}), nome: v } })} />
                    <Field label="Contato (telefone/WhatsApp)" value={p.proprietario?.contato} onChange={(v) => update(i, { ...p, proprietario: { ...(p.proprietario || {}), contato: v } })} />
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-sm text-ink-secondary">
                    <input type="checkbox" checked={!!p.proprietario?.exclusividade} onChange={(e) => update(i, { ...p, proprietario: { ...(p.proprietario || {}), exclusividade: e.target.checked } })} className="h-4 w-4 accent-primary" />
                    Contrato de exclusividade com a Paula
                  </label>
                </div>

                {/* Captação (campo) */}
                <div className="rounded-lg border border-black/10 bg-white p-3">
                  <span className="mb-2 block text-sm font-semibold text-ink-secondary">Captação</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-ink-secondary">Data da captação</span>
                      <input type="date" value={p.captacao?.data || ""} onChange={(e) => update(i, { ...p, captacao: { ...(p.captacao || {}), data: e.target.value } })} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary" />
                    </label>
                    <Field label="Capturado por" value={p.captacao?.capturadoPor} onChange={(v) => update(i, { ...p, captacao: { ...(p.captacao || {}), capturadoPor: v } })} placeholder="Ex: nome do fotógrafo" />
                  </div>
                  <div className="mt-3">
                    <TextArea label="Observações da captação" value={p.captacao?.observacoes} onChange={(v) => update(i, { ...p, captacao: { ...(p.captacao || {}), observacoes: v } })} />
                  </div>
                </div>

                {/* Material no Google Drive */}
                <div className="rounded-lg border border-black/10 bg-white p-3">
                  <span className="mb-2 block text-sm font-semibold text-ink-secondary">Material (Drive)</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DriveLinkField label="Link da pasta de fotos (Drive)" value={p.driveLinks?.fotos} onChange={(v) => update(i, { ...p, driveLinks: { ...(p.driveLinks || {}), fotos: v } })} />
                    <DriveLinkField label="Link do vídeo (Drive)" value={p.driveLinks?.video} onChange={(v) => update(i, { ...p, driveLinks: { ...(p.driveLinks || {}), video: v } })} />
                  </div>
                </div>

                {/* Distribuição (checklist de marketing) */}
                <div className="rounded-lg border border-black/10 bg-white p-3">
                  <span className="mb-1 block text-sm font-semibold text-ink-secondary">Distribuição <span className="font-normal text-ink-muted">({distribCount(p)}/{DISTRIBUICAO_ITENS.length})</span></span>
                  <p className="mb-2 text-xs text-ink-muted">Marque conforme for postando/anunciando.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DISTRIBUICAO_ITENS.map((it) => (
                      <label key={it.key} className="flex items-center gap-2 rounded-md border border-black/10 bg-black/[0.02] p-2.5 text-sm text-ink-secondary">
                        <input type="checkbox" checked={!!p.distribuicao?.[it.key]} onChange={(e) => update(i, { ...p, distribuicao: { ...(p.distribuicao || {}), [it.key]: e.target.checked } })} className="h-4 w-4 accent-primary" />
                        {it.label}
                      </label>
                    ))}
                  </div>
                </div>

                <MultiImageField images={p.images || []} onChange={(imgs) => update(i, { ...p, images: imgs })} coverImage={p.coverImage} showCover={!!p.cover} onSetCover={(src) => update(i, { ...p, coverImage: src })} />
                <button onClick={() => remove(i)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Excluir imóvel</button>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ===================== CAPA / BUSCA ===================== */

function CapaTab({ data, patch }) {
  const h = data.hero;
  return (
    <Card title="Capa / Hero">
      <Field label="Título (1ª linha)" value={h.titleLine1} onChange={(v) => patch("hero", "titleLine1", v)} />
      <Field label="Título (2ª linha, em negrito)" value={h.titleLine2} onChange={(v) => patch("hero", "titleLine2", v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Selo do card da capa (texto pequeno acima do título)" value={h.cardBadge} onChange={(v) => patch("hero", "cardBadge", v)} />
        <Field label="Texto do botão do card da capa" value={h.cardButton} onChange={(v) => patch("hero", "cardButton", v)} />
      </div>
      <NumberField label="Intervalo do carrossel da capa (segundos)" value={h.coverInterval} onChange={(v) => patch("hero", "coverInterval", v)} />
      <p className="-mt-2 text-xs text-ink-muted">Tempo entre uma capa e outra quando há vários imóveis marcados como capa (mínimo 2s).</p>
      <ImageField label="Imagem de fundo (usada só quando nenhum imóvel está marcado como capa)" value={h.image} onChange={(v) => patch("hero", "image", v)} />
      <p className="text-xs text-ink-muted">
        A foto de fundo da capa vem do imóvel marcado como <strong>“Capa da home”</strong> na aba Imóveis.
      </p>
    </Card>
  );
}

/* ===================== MARCA & CORES ===================== */

function MarcaTab({ data, patch }) {
  const b = data.brand;
  const c = data.colors;
  return (
    <>
      <Card title="Marca">
        <Field label="Nome (parte 1)" value={b.name} onChange={(v) => patch("brand", "name", v)} />
        <Field label="Nome destacado (parte 2)" value={b.nameHighlight} onChange={(v) => patch("brand", "nameHighlight", v)} />
        <Field label="Subtítulo / profissão" value={b.tagline} onChange={(v) => patch("brand", "tagline", v)} />
      </Card>
      <Card title="Cores do tema">
        <p className="-mt-2 text-xs text-ink-muted">Estas cores valem para o site inteiro. Veja onde cada uma aparece:</p>
        <ColorField
          label="Cor primária (âmbar)"
          hint="Botões de ação (Buscar, Ver imóvel, Ver todos os imóveis, Falar com a Paula), barra do rodapé e detalhes em âmbar."
          value={c.primary}
          onChange={(v) => patch("colors", "primary", v)}
        />
        <ColorField
          label="Primária — ao passar o mouse"
          hint="Cor que os botões âmbar assumem quando o cursor passa por cima (efeito hover)."
          value={c.primaryHover}
          onChange={(v) => patch("colors", "primaryHover", v)}
        />
        <ColorField
          label="Dourado (textos em destaque)"
          hint="Números da faixa de credenciais, preços dos imóveis, partes destacadas dos títulos e o selo “Imóvel em destaque”."
          value={c.primaryDark}
          onChange={(v) => patch("colors", "primaryDark", v)}
        />
      </Card>
    </>
  );
}

/* ===================== MENU & CONTATO ===================== */

function MenuTab({ data, patch, setSection }) {
  const c = data.contact;
  return (
    <>
      <Card title="Menu (links do topo)">
        <LinkEditor items={data.nav} onChange={(v) => setSection("nav", v)} />
        <Field label="Texto do botão de contato no topo do site" value={data.header.faleConosco} onChange={(v) => patch("header", "faleConosco", v)} />
      </Card>
      <Card title="Contato & Redes">
        <Field label="WhatsApp (só números, com DDI 55)" value={c.whatsapp} onChange={(v) => patch("contact", "whatsapp", v)} placeholder="5512999999999" />
        <Field label="Telefone exibido" value={c.phoneDisplay} onChange={(v) => patch("contact", "phoneDisplay", v)} />
        <Field label="CRECI" value={c.creci} onChange={(v) => patch("contact", "creci", v)} />
        <Field label="E-mail (opcional)" value={c.email} onChange={(v) => patch("contact", "email", v)} />
        <Field label="Instagram (URL)" value={c.instagram} onChange={(v) => patch("contact", "instagram", v)} />
        <Field label="Facebook (URL)" value={c.facebook} onChange={(v) => patch("contact", "facebook", v)} />
      </Card>
    </>
  );
}

/* ===================== SEÇÕES DA HOME ===================== */

function SecoesTab({ data, patch, setSection }) {
  const a = data.about;
  const f = data.featured;
  const ci = data.cities;
  return (
    <>
      <Card title="Faixa de credenciais">
        <ArrayEditor items={data.ribbon} onChange={(v) => setSection("ribbon", v)} empty={{ pre: "+", strong: "", post: "" }} render={(item, upd) => (
          <div className="grid grid-cols-3 gap-2">
            <Mini label="Prefixo" value={item.pre} onChange={(v) => upd({ ...item, pre: v })} />
            <Mini label="Destaque" value={item.strong} onChange={(v) => upd({ ...item, strong: v })} />
            <Mini label="Restante" value={item.post} onChange={(v) => upd({ ...item, post: v })} />
          </div>
        )} />
      </Card>

      <Card title="Sobre a Paula">
        <ImageField label="Foto" value={a.photo} onChange={(v) => patch("about", "photo", v)} />
        <Field label="Rótulo (eyebrow)" value={a.eyebrow} onChange={(v) => patch("about", "eyebrow", v)} />
        <Field label="Título" value={a.title} onChange={(v) => patch("about", "title", v)} />
        <Field label="Título destacado" value={a.titleHighlight} onChange={(v) => patch("about", "titleHighlight", v)} />
        <TextArea label="Texto" value={a.text} onChange={(v) => patch("about", "text", v)} />
        <Field label="Texto do botão" value={a.buttonText} onChange={(v) => patch("about", "buttonText", v)} />
        <p className="mt-2 text-sm font-medium text-ink-secondary">Estatísticas</p>
        <ArrayEditor items={a.highlights} onChange={(v) => patch("about", "highlights", v)} empty={{ value: "", label: "" }} render={(item, upd) => (
          <div className="grid grid-cols-2 gap-2">
            <Mini label="Número" value={item.value} onChange={(v) => upd({ ...item, value: v })} />
            <Mini label="Rótulo" value={item.label} onChange={(v) => upd({ ...item, label: v })} />
          </div>
        )} />
      </Card>

      <Card title="Destaques em imóveis (títulos)">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Título" value={f.heading} onChange={(v) => patch("featured", "heading", v)} />
          <Field label="Título destacado" value={f.headingHighlight} onChange={(v) => patch("featured", "headingHighlight", v)} />
          <Field label="Texto do link ao lado do título (vai para a lista de imóveis)" value={f.seeMore} onChange={(v) => patch("featured", "seeMore", v)} />
        </div>
        <p className="text-xs text-ink-muted">Os imóveis exibidos aqui são os marcados como “destaque” na aba Imóveis.</p>
      </Card>

      <Card title="Cidades & Bairros">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Título" value={ci.heading} onChange={(v) => patch("cities", "heading", v)} />
          <Field label="Título destacado" value={ci.headingHighlight} onChange={(v) => patch("cities", "headingHighlight", v)} />
        </div>
        <p className="rounded-lg bg-black/[0.03] p-3 text-xs text-ink-muted">
          A lista de <strong>cidades e bairros</strong> é montada automaticamente a partir dos imóveis cadastrados (aba Imóveis) —
          cada bairro só aparece se houver pelo menos um imóvel nele. Aqui você edita apenas o título da seção.
        </p>
      </Card>
    </>
  );
}

/* ===================== FORMULÁRIO ===================== */

function FormTab({ data, patch }) {
  const r = data.register;
  return (
    <Card title="Seção de cadastro (Formulário)">
      <Field label="Título — linha 1" value={r.headingLine1} onChange={(v) => patch("register", "headingLine1", v)} />
      <Field label="Título — linha 2" value={r.headingLine2} onChange={(v) => patch("register", "headingLine2", v)} />
      <Field label="Título — parte destacada" value={r.headingHighlight} onChange={(v) => patch("register", "headingHighlight", v)} />
      <TextArea label="Descrição" value={r.description} onChange={(v) => patch("register", "description", v)} />
      <ImageField label="Imagem de fundo" value={r.image} onChange={(v) => patch("register", "image", v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Título do formulário" value={r.formTitle} onChange={(v) => patch("register", "formTitle", v)} />
        <Field label="Subtítulo do formulário" value={r.formSubtitle} onChange={(v) => patch("register", "formSubtitle", v)} />
      </div>
      <Field label="Texto do botão enviar" value={r.submitText} onChange={(v) => patch("register", "submitText", v)} />
      <TextArea label="Texto dos termos (checkbox)" value={r.termsText} onChange={(v) => patch("register", "termsText", v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mensagem de sucesso — título" value={r.successTitle} onChange={(v) => patch("register", "successTitle", v)} />
        <Field label="Mensagem de sucesso — texto" value={r.successText} onChange={(v) => patch("register", "successText", v)} />
      </div>
    </Card>
  );
}

/* ===================== RODAPÉ ===================== */

function RodapeTab({ data, patch }) {
  const f = data.footer;
  return (
    <>
      <Card title="Rodapé — informações">
        <TextArea label="Texto sob a marca" value={f.aboutText} onChange={(v) => patch("footer", "aboutText", v)} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Título atendimento" value={f.attendanceTitle} onChange={(v) => patch("footer", "attendanceTitle", v)} />
          <Field label="Cidade/UF" value={f.attendanceCity} onChange={(v) => patch("footer", "attendanceCity", v)} />
          <Field label="Região" value={f.attendanceRegion} onChange={(v) => patch("footer", "attendanceRegion", v)} />
        </div>
      </Card>

      <Card title="Rodapé — colunas de links">
        <ArrayEditor items={f.columns} onChange={(v) => patch("footer", "columns", v)} empty={{ title: "", links: [] }} render={(col, upd) => (
          <div className="space-y-2">
            <Mini label="Título da coluna" value={col.title} onChange={(v) => upd({ ...col, title: v })} />
            <p className="text-xs text-ink-muted">Links</p>
            <LinkEditor items={col.links} onChange={(links) => upd({ ...col, links })} />
          </div>
        )} />
      </Card>
    </>
  );
}

/* ===================== Multi imagem (imóveis) ===================== */

function MultiImageField({ images, onChange, coverImage, showCover, onSetCover }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");
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
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-ink-secondary">Fotos do imóvel</span>
      <div className="flex flex-wrap gap-2">
        {images.map((src, idx) => {
          const isCover = showCover && coverImage === src;
          return (
            <div key={idx} className={`relative h-24 w-32 overflow-hidden rounded-lg border-2 ${isCover ? "border-primary" : "border-black/10"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
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
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input type="file" accept="image/*,.dng,.heic,.heif,.tif,.tiff,.webp,.avif,.cr2,.cr3,.nef,.arw,.raf,.rw2,.orf,.raw" multiple onChange={handleFiles} className="text-sm text-ink-secondary file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:text-white" />
        {busy && <span className="text-xs text-ink-muted">Enviando...</span>}
      </div>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <div className="mt-2 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ou cole uma URL de imagem" className="h-9 flex-1 rounded-lg border border-inputborder px-2 text-xs outline-none focus:border-primary" />
        <button onClick={() => { if (url.trim()) { onChange([...images, url.trim()]); setUrl(""); } }} className="rounded-lg bg-black/5 px-3 text-sm hover:bg-black/10">Adicionar</button>
      </div>
    </div>
  );
}

/* ===================== Helpers de campo ===================== */

function linesToArray(v) {
  return v.split("\n").map((s) => s.trim()).filter(Boolean);
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-6">
      <h2 className="mb-4 font-poppins text-lg font-semibold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <input value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary focus:shadow-focus" />
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <input type="number" min="0" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function DriveLinkField({ label, value, onChange }) {
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

function LabeledSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Mini({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-muted">{label}</span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <textarea value={value || ""} rows={4} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-inputborder px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-focus" />
    </label>
  );
}

function ColorField({ label, hint, value, onChange }) {
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

function ImageField({ label, value, onChange, compact }) {
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
function LinkEditor({ items = [], onChange }) {
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
function ArrayEditor({ items = [], onChange, render, empty }) {
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
