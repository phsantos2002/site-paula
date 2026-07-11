"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatBRL } from "@/lib/format";

const TABS = [
  { id: "imoveis", label: "Imóveis", icon: "M3 11l9-8 9 8M5 9.5V21h14V9.5" },
  { id: "equipe", label: "Equipe & Funil", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { id: "template", label: "Templates", icon: "M3 3h18v18H3zM3 9h18M9 21V9" },
  { id: "contatos", label: "Contatos", icon: "M22 5H2v14h20zM2 6l10 7 10-7" },
];

const OPERATIONS = ["Venda", "Aluguel", "Financiamento"];
const TYPES = ["Apartamento", "Casa", "Terreno", "Comercial"];

const STATUS_OPTIONS = [
  { value: "disponivel", label: "Disponível" },
  { value: "exclusividade", label: "Exclusividade" },
  { value: "vendido", label: "Vendido" },
  { value: "alugado", label: "Alugado" },
];
// Equipe e funil vêm do content (editáveis por cliente). Estes são só FALLBACKS,
// usados quando o content ainda não trouxe nada · o painel nunca fica quebrado.
const DEFAULT_TEAM = [
  { id: "captador", name: "Captador", role: "Fotos & Vídeo", emoji: "🎥", color: "#4f46e5" },
  { id: "corretor", name: "Corretor(a)", role: "Corretagem", emoji: "👤", color: "#db2777" },
  { id: "gestor", name: "Gestor", role: "Anúncios & Site", emoji: "🧑‍💻", color: "#b7791f" },
];
const DEFAULT_FUNNEL = [
  { id: "captado", label: "Captação", owner: "captador", hint: "Visita e captação do imóvel" },
  { id: "fotos_drive", label: "Fotos no Drive", owner: "captador", hint: "Sobe as fotos (mesmo dia)" },
  { id: "video_editado", label: "Vídeo editado", owner: "captador", hint: "Edita e sobe o vídeo" },
  { id: "infos", label: "Infos com o corretor", owner: "corretor", hint: "Coleta os dados do imóvel" },
  { id: "no_site", label: "No site", owner: "gestor", hint: "Publica e divulga" },
];
// Estilo do chip derivado da cor do membro (fundo/borda em transparência do próprio hex).
function memberStyle(m) {
  const col = (m && m.color) || "#6b7280";
  return { color: col, background: col + "1a", ring: col + "55" };
}

// Checklist de divulgação (marketing do gestor) · interno ao painel.
const DISTRIBUICAO_ITENS = [
  { key: "carrossel", label: "Carrossel (Instagram)" },
  { key: "reels", label: "Reels (Instagram)" },
  { key: "anuncio", label: "Anúncio (Meta Ads)" },
];

// Colunas/seções fixas de negócio fechado, depois do funil. Baseadas na SITUAÇÃO
// (status), não na etapa · um imóvel vendido/alugado vive aqui, publicado ou não.
const SPECIAL_COLS = [
  { id: "__vendidos", label: "Vendidos", status: "vendido", accent: "#111827", emoji: "💰", hint: "Venda fechada" },
  { id: "__alugados", label: "Alugados", status: "alugado", accent: "#0ea5e9", emoji: "🔑", hint: "Locação fechada" },
];
function distribCount(p) {
  return DISTRIBUICAO_ITENS.filter((it) => p.distribuicao?.[it.key]).length;
}
function DistribDots({ p }) {
  return (
    <span className="flex items-center gap-0.5">
      {DISTRIBUICAO_ITENS.map((it) => (
        <span key={it.key} className={`h-1.5 w-1.5 rounded-full ${p.distribuicao?.[it.key] ? "bg-primary-dark" : "bg-black/15"}`} />
      ))}
    </span>
  );
}

// Três marcos de preenchimento do imóvel, espelhando o fluxo da equipe:
// 1- Material no Drive · 2- Texto bruto · 3- Ficha do site.
const STEPS = [
  { key: "material", short: "Fotos", emoji: "📸", done: (p) => !!(p.images?.length || p.driveLinks?.fotos || p.driveLinks?.video) },
  { key: "texto", short: "Texto", emoji: "✍️", done: (p) => !!(p.textoBruto && p.textoBruto.trim()) },
  { key: "ficha", short: "Ficha", emoji: "📋", done: (p) => !!(p.title && (p.price > 0 || p.rentPrice > 0) && p.images?.length) },
];
function StepDots({ p }) {
  return (
    <span className="flex items-center gap-1">
      {STEPS.map((s) => {
        const ok = s.done(p);
        return <span key={s.key} title={`${s.short}${ok ? " ✓" : " pendente"}`} className={`text-[11px] leading-none ${ok ? "" : "opacity-25 grayscale"}`}>{s.emoji}</span>;
      })}
    </span>
  );
}
// Valor compacto para os cards (ex.: R$ 1,25 mi · R$ 850 mil).
function formatBRLShort(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 2).replace(".", ",")} mi`;
  if (v >= 1_000) return `R$ ${Math.round(v / 1000)} mil`;
  return v > 0 ? `R$ ${v}` : "";
}
// Busca do painel: casa o termo com título, código, bairro, cidade, tipo E o texto bruto
// (rascunhos sem título são identificados pelo texto bruto que aparece no card). `q` já vem
// em minúsculas e sem espaços nas pontas.
function propMatches(p, q) {
  if (!q) return true;
  return `${p.title} ${p.code} ${p.neighborhood} ${p.city} ${p.type} ${p.textoBruto}`.toLowerCase().includes(q);
}

// Rótulo do card: usa o título; se ainda for rascunho sem título, mostra o começo do
// texto bruto para facilitar a identificação. Retorna { text, isPlaceholder }.
function cardLabel(p, fallback = "Novo imóvel · clique para preencher") {
  if (p?.title?.trim()) return { text: p.title.trim(), isPlaceholder: false };
  const raw = (p?.textoBruto || "").replace(/\s+/g, " ").trim();
  if (raw) return { text: raw.length > 90 ? raw.slice(0, 90).trimEnd() + "…" : raw, isPlaceholder: false };
  return { text: fallback, isPlaceholder: true };
}
// Cabeçalho de etapa dentro do editor.
function StepHeader({ n, emoji, title, who, done }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-[#4ecb5b] text-white" : "bg-black/10 text-ink-muted"}`}>{done ? "✓" : n}</span>
      <span className="text-sm font-semibold text-ink">{emoji} {title}</span>
      {who && <span className="text-xs text-ink-muted">· {who}</span>}
    </div>
  );
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
  const [tab, setTab] = useState("imoveis");
  const [saveState, setSaveState] = useState("saved"); // saved | dirty | saving | error
  const [msg, setMsg] = useState(null);
  // Navegação da aba Templates (template aberto + sub-aba). Vive aqui para não se
  // perder quando o usuário alterna para outra aba do painel e volta.
  const [tplNav, setTplNav] = useState({ openId: null, sub: "visao" });

  // Refs sempre com o valor mais recente — o auto-save lê daqui (sem stale closure).
  const dataRef = useRef(data); dataRef.current = data;
  const propsRef = useRef(properties); propsRef.current = properties;
  const leadsRef = useRef(leads); leadsRef.current = leads;
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);

  // patch(section, key, value) -> data[section][key] = value (cobre objetos e arrays-valor)
  function patch(section, key, value) {
    setData((d) => ({ ...d, [section]: { ...d[section], [key]: value } }));
  }
  // setSection(section, value) -> data[section] = value (arrays de topo: nav, ribbon, services)
  function setSection(section, value) {
    setData((d) => ({ ...d, [section]: value }));
  }

  // Envio bruto dos 3 payloads. `keepalive` permite que a requisição sobreviva ao
  // fechar/recarregar a aba (usado no logout e no visibilitychange).
  async function persist(sentData, sentProps, sentLeads, keepalive = false) {
    const base = { method: "POST", headers: { "Content-Type": "application/json" }, ...(keepalive ? { keepalive: true } : {}) };
    let ok = false, errText = "Erro ao salvar.";
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/admin/save", { ...base, body: JSON.stringify(sentData) }),
        fetch("/api/admin/properties", { ...base, body: JSON.stringify({ properties: sentProps }) }),
        fetch("/api/admin/leads", { ...base, body: JSON.stringify({ leads: sentLeads }) }),
      ]);
      const j1 = await r1.json().catch(() => ({}));
      const j2 = await r2.json().catch(() => ({}));
      const j3 = await r3.json().catch(() => ({}));
      ok = !!(j1.ok && j2.ok && j3.ok);
      errText = j1.error || j2.error || j3.error || errText;
    } catch { errText = "Sem conexão."; }
    return { ok, errText };
  }

  // Persiste tudo (conteúdo + imóveis + contatos). Sem sincronizar a resposta de volta
  // para o estado — o cliente é a fonte da verdade e isso evita loop com o auto-save.
  async function flush(manual = false) {
    if (savingRef.current) { pendingRef.current = true; return; } // já salvando: reprograma depois
    savingRef.current = true;
    setSaveState("saving");
    if (manual) setMsg(null);
    const sentData = dataRef.current, sentProps = propsRef.current, sentLeads = leadsRef.current;
    const { ok, errText } = await persist(sentData, sentProps, sentLeads);
    savingRef.current = false;
    // Mudou algo enquanto salvava? Continua sujo -> salva de novo em breve.
    const changedDuring = dataRef.current !== sentData || propsRef.current !== sentProps || leadsRef.current !== sentLeads;
    if (!ok) {
      setSaveState("error");
      setMsg({ type: "err", text: errText });
    } else if (changedDuring || pendingRef.current) {
      pendingRef.current = false;
      scheduleSave(500);
    } else {
      dirtyRef.current = false;
      setSaveState("saved");
      if (manual) setMsg({ type: "ok", text: "Tudo salvo!" });
    }
  }

  function scheduleSave(delay = 1200) {
    clearTimeout(timerRef.current);
    dirtyRef.current = true;
    setSaveState("dirty");
    timerRef.current = setTimeout(() => flush(false), delay);
  }

  async function logout() {
    clearTimeout(timerRef.current);
    // Salva o estado MAIS RECENTE com keepalive (sobrevive ao reload), sem depender
    // do flush guardado — assim não perde edições feitas durante um save em andamento.
    try { await persist(dataRef.current, propsRef.current, leadsRef.current, true); } catch {}
    await fetch("/api/admin/logout", { method: "POST", keepalive: true });
    window.location.reload();
  }

  // Auto-save (debounced) a cada mudança de conteúdo / imóveis / contatos.
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    scheduleSave();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, properties, leads]);

  // Salva ao minimizar/fechar a aba (celular/desktop) para não perder nada pendente.
  // keepalive garante que o POST complete mesmo se a aba for fechada em seguida.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden" || !dirtyRef.current) return;
      clearTimeout(timerRef.current);
      persist(dataRef.current, propsRef.current, leadsRef.current, true)
        .then((r) => { if (r.ok) dirtyRef.current = false; })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // some o aviso sozinho
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
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
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
            <button
              onClick={() => flush(true)}
              disabled={saveState === "saving"}
              title="Salvamento automático — clique para salvar agora"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:cursor-default ${
                saveState === "error"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : saveState === "dirty"
                  ? "bg-primary text-ink-cta hover:bg-primary-hover"
                  : saveState === "saving"
                  ? "bg-ink text-white opacity-80"
                  : "bg-[#eaf7ee] text-[#2fa03c]"
              }`}
            >
              {saveState === "saving" ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.22-8.56" /></svg>Salvando…</>
              ) : saveState === "error" ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>Não salvou · salvar</>
              ) : saveState === "dirty" ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" /></svg>Salvar agora</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Salvo</>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1760px] px-4 py-5 md:px-6 lg:flex lg:gap-6">
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

        <div className="min-w-0 flex-1 space-y-6 overflow-x-clip">
          {tab === "contatos" && <ContatosTab leads={leads} setLeads={setLeads} />}
          {tab === "imoveis" && <ImoveisTab properties={properties} setProperties={setProperties} data={data} />}
          {tab === "equipe" && <EquipeTab data={data} setSection={setSection} />}
          {tab === "template" && <TemplatesTab data={data} patch={patch} setSection={setSection} nav={tplNav} setNav={setTplNav} notify={setMsg} />}
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
        Mensagens enviadas pelo formulário do site. As alterações são <strong>salvas automaticamente</strong>.
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
                    <p className="text-xs text-ink-muted">{formatDate(l.createdAt)} · Interesse: {l.tipo || "·"}</p>
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
    description: "", textoBruto: "", features: [], condoFeatures: [], images: [], featured: false,
    // Nasce como rascunho invisível no site, na primeira etapa do funil:
    status: "disponivel", etapa: "captado", publicado: false, responsavel: "",
    condominio: "", andar: 0, mobiliado: false,
    proprietario: { nome: "", contato: "", exclusividade: false },
    captacao: { data: "", capturadoPor: "", observacoes: "" },
    driveLinks: { fotos: "", video: "" },
    distribuicao: { carrossel: false, reels: false, anuncio: false },
  };
}

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "rascunhos", label: "Rascunhos" },
  { value: "publicados", label: "Publicados" },
  { value: "distrib_pendente", label: "Divulgação pendente" },
];

/* Chip do responsável (só leitura). Recebe o membro já resolvido do time. */
function ResponsavelChip({ member, size = "sm" }) {
  if (!member) return <span className="text-[11px] text-ink-muted">sem responsável</span>;
  const s = memberStyle(member);
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${pad}`} style={{ color: s.color, background: s.background, boxShadow: `inset 0 0 0 1px ${s.ring}` }}>
      <span>{member.emoji}</span>{member.name}
    </span>
  );
}

/* Seletor de responsável (card e editor). `team` = lista de membros do content. */
function RespPicker({ value, onChange, team, compact }) {
  const m = (team || []).find((t) => t.id === value);
  const s = m ? memberStyle(m) : { color: "#6b7280", background: "#f3f4f6", ring: "#e5e7eb" };
  return (
    <span className="relative inline-flex min-w-0 max-w-full">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className={`w-full cursor-pointer appearance-none truncate rounded-full border-0 font-semibold outline-none ${compact ? "max-w-[150px] py-1 pl-2 pr-6 text-[11px]" : "h-10 pl-3 pr-8 text-sm"}`}
        style={{ color: s.color, background: s.background, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
      >
        <option value="">👤 Sem responsável</option>
        {(team || []).map((o) => <option key={o.id} value={o.id}>{o.emoji} {o.name}</option>)}
      </select>
      <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${compact ? "right-1.5" : "right-2.5"} text-[9px]`} style={{ color: s.color }}>▼</span>
    </span>
  );
}

/* Selo de situação (admin, tamanho xs). Exclusividade âmbar · Vendido verde · Alugado azul.
   "Disponível" só quando showDisponivel; senão fica oculto p/ não poluir. */
const SITUACAO_BADGE = {
  exclusividade: { label: "EXCLUSIVIDADE", cls: "bg-primary text-ink-cta" },
  vendido: { label: "VENDIDO", cls: "text-white", style: { background: "#16a34a" } },
  alugado: { label: "ALUGADO", cls: "text-white", style: { background: "#0ea5e9" } },
};
function SituacaoBadge({ status, showDisponivel = false }) {
  const s = SITUACAO_BADGE[status];
  if (s) return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.cls}`} style={s.style}>{s.label}</span>;
  if (showDisponivel) return <span className="rounded bg-[#e8f8ea] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2fa03c]">Disponível</span>;
  return null;
}

/* Menu de ações (⋮) do imóvel: Editar / Excluir. O dropdown vai por portal para não
   ser cortado pelo card (overflow) nem por transform de ancestral. */
function RowMenu({ onEdit, onDelete, overlay = false }) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  function toggle(e) {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.right - 192, window.innerWidth - 200)) });
  }
  const pick = (fn) => (e) => { e.stopPropagation(); setPos(null); fn(); };
  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Ações"
        aria-label="Ações do imóvel"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-black/10 hover:text-ink ${overlay ? "bg-white/95 shadow-sm ring-1 ring-black/10" : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>
      </button>
      {pos != null && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setPos(null); }} onContextMenu={(e) => { e.preventDefault(); setPos(null); }} />
          <div className="fixed z-[61] w-48 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-xl" style={{ top: pos.top, left: pos.left }} onClick={(e) => e.stopPropagation()}>
            <button onClick={pick(onEdit)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-ink-secondary hover:bg-black/5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              Editar imóvel
            </button>
            <button onClick={pick(onDelete)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></svg>
              Excluir imóvel
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

/* Card do Kanban — limpo e premium: foto, título, código, valor, situação e estado (no ar/rascunho).
   Faixa lateral colorida pelo estado (verde no ar · âmbar rascunho · verde/azul vendido/alugado). */
function KanbanCard({ p, i, active, onOpen, onDelete, onDragStart, onDragEnd, onMove, canPrev, canNext }) {
  const priceTxt = p.price > 0 ? formatBRLShort(p.price) : p.rentPrice > 0 ? `${formatBRLShort(p.rentPrice)}/mês` : "";
  const stripe = p.status === "vendido" ? "#16a34a" : p.status === "alugado" ? "#0ea5e9" : p.publicado ? "#4ecb5b" : "#ffa200";
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ borderLeftColor: stripe }}
      className={`group relative overflow-hidden rounded-xl border border-l-[6px] border-black/10 bg-white shadow-sm transition active:cursor-grabbing ${active ? "opacity-40" : "hover:-translate-y-0.5 hover:shadow-md"}`}
    >
      {/* Menu de ações (⋮): Editar / Excluir */}
      <div className="absolute right-1 top-1 z-20" onClick={(e) => e.stopPropagation()}>
        <RowMenu onEdit={onOpen} onDelete={onDelete} overlay />
      </div>
      <div className="flex cursor-pointer" role="button" onClick={onOpen}>
        <div className="flex min-w-0 flex-1 gap-2.5 p-2.5">
          {p.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0]} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
          ) : (<span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-black/5 text-ink-muted">🏠</span>)}
          <div className="min-w-0 flex-1">
            {(() => { const lbl = cardLabel(p, "Novo imóvel · clique"); return (
            <div className={`truncate pr-7 text-[13px] font-semibold leading-snug ${lbl.isPlaceholder ? "italic text-ink-muted" : "text-ink"}`}>{lbl.text}</div>
            ); })()}
            <div className="mt-0.5 truncate text-[11px] text-ink-muted">Cód {p.code}{p.neighborhood ? ` · ${p.neighborhood}` : ""}</div>
            {priceTxt && <div className="mt-0.5 truncate text-[13px] font-bold text-primary-dark">{priceTxt}</div>}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <SituacaoBadge status={p.status} />
              {p.publicado
                ? <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8ea] px-1.5 py-0.5 text-[10px] font-semibold text-[#2fa03c]"><span className="h-1.5 w-1.5 rounded-full bg-[#4ecb5b]" />no ar</span>
                : <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3e0] px-1.5 py-0.5 text-[10px] font-semibold text-[#b7791f]"><span className="h-1.5 w-1.5 rounded-full bg-[#ffa200]" />rascunho</span>}
            </div>
          </div>
        </div>
      </div>

      {(p.cover || p.featured) && (
        <div className="flex items-center gap-1.5 border-t border-black/5 px-2.5 py-1.5">
          {p.cover && <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-ink-secondary">🏠 Capa</span>}
          {p.featured && <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-ink-secondary">⭐ Destaque</span>}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-black/5 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => onMove(-1)} disabled={!canPrev} title="Coluna anterior" className="flex h-6 w-7 items-center justify-center rounded text-ink-muted hover:bg-black/5 disabled:opacity-25">◄</button>
        <span className="text-[10px] text-ink-muted">mover</span>
        <button onClick={() => onMove(1)} disabled={!canNext} title="Próxima coluna" className="flex h-6 w-7 items-center justify-center rounded text-ink-muted hover:bg-black/5 disabled:opacity-25">►</button>
      </div>
    </div>
  );
}

/* Editor completo do imóvel (compartilhado entre Kanban e Lista). */
function PropertyEditor({ p, i, update, remove, team = DEFAULT_TEAM, funnel = DEFAULT_FUNNEL }) {
  const etapaOptions = funnel.map((f) => ({ value: f.id, label: f.label }));
  const lastId = funnel[funnel.length - 1]?.id;
  const prevId = funnel[funnel.length - 2]?.id || funnel[0]?.id; // etapa antes da última
  const productionOptions = etapaOptions.filter((o) => o.value !== lastId); // etapas manuais (sem "No site")
  const lastLabel = etapaOptions.find((o) => o.value === lastId)?.label || "No site";
  return (
    <div className="space-y-4">
      {/* Fluxo de trabalho: responsável + etapa + situação */}
      <div className="rounded-lg border border-black/10 bg-white p-3">
        <span className="mb-2 block text-sm font-semibold text-ink-secondary">Fluxo de trabalho</span>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">Responsável agora</span>
            <RespPicker team={team} value={p.responsavel} onChange={(v) => update(i, { ...p, responsavel: v })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">Etapa (funil)</span>
            {p.status === "vendido" ? (
              <div className="flex h-10 items-center gap-1.5 rounded-lg border border-[#16a34a]/30 bg-[#eaf7ee] px-3 text-sm font-semibold text-[#16a34a]" title="Definido pela situação (Vendido)">
                💰 Vendido
              </div>
            ) : p.status === "alugado" ? (
              <div className="flex h-10 items-center gap-1.5 rounded-lg border border-[#0ea5e9]/40 bg-[#e6f6fd] px-3 text-sm font-semibold text-[#0284c7]" title="Definido pela situação (Alugado)">
                🔑 Alugado
              </div>
            ) : p.publicado ? (
              <div className="flex h-10 items-center gap-1.5 rounded-lg border border-[#16a34a]/30 bg-[#eaf7ee] px-3 text-sm font-semibold text-[#16a34a]" title="Definido pela publicação — use o botão Rascunho para voltar à produção">
                ✅ {lastLabel}
              </div>
            ) : (
              <select
                value={p.etapa && p.etapa !== lastId ? p.etapa : productionOptions[0]?.value}
                onChange={(e) => update(i, { ...p, etapa: e.target.value, publicado: false })}
                className="h-10 w-full rounded-lg border border-inputborder px-3 text-sm outline-none focus:border-primary"
              >
                {productionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </label>
          <LabeledSelect label="Situação (badge no site)" value={p.status || "disponivel"} options={STATUS_OPTIONS} onChange={(v) => update(i, { ...p, status: v })} />
        </div>
        <div className="mt-3">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">Publicação no site</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-black/10">
            <button
              type="button"
              onClick={() => update(i, { ...p, publicado: false, etapa: p.etapa === lastId ? prevId : p.etapa })}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${!p.publicado ? "bg-[#ffa200] text-white" : "bg-white text-ink-secondary hover:bg-black/5"}`}
            >📝 Rascunho</button>
            <button
              type="button"
              onClick={() => update(i, { ...p, publicado: true, etapa: lastId })}
              className={`flex items-center gap-1.5 border-l border-black/10 px-4 py-2 text-sm font-semibold transition-colors ${p.publicado ? "bg-[#16a34a] text-white" : "bg-white text-ink-secondary hover:bg-black/5"}`}
            >✅ Publicado no site</button>
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            {p.publicado
              ? "Está no ar: aparece na home e na listagem do site."
              : "É rascunho: existe só aqui no painel. Clique em “Publicado no site” para colocar no ar."}
          </p>
        </div>
      </div>

      {/* Passo 1 · Material do imóvel (fotos + Drive) — o que o Guilherme adiciona primeiro */}
      <div className="rounded-lg border border-black/10 bg-white p-3">
        <StepHeader n={1} emoji="📸" title="Material do imóvel" who="fotos e vídeo" done={STEPS[0].done(p)} />
        <MultiImageField images={p.images || []} onChange={(imgs) => update(i, { ...p, images: imgs })} coverImage={p.coverImage} showCover={!!p.cover} onSetCover={(src) => update(i, { ...p, coverImage: src })} zipName={`imovel-${p.code}`} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DriveLinkField label="Link da pasta de fotos (Drive)" value={p.driveLinks?.fotos} onChange={(v) => update(i, { ...p, driveLinks: { ...(p.driveLinks || {}), fotos: v } })} />
          <DriveLinkField label="Link do vídeo (Drive)" value={p.driveLinks?.video} onChange={(v) => update(i, { ...p, driveLinks: { ...(p.driveLinks || {}), video: v } })} />
        </div>
      </div>

      {/* Passo 2 · Texto bruto */}
      <div className="rounded-lg border border-black/10 bg-white p-3">
        <StepHeader n={2} emoji="✍️" title="Texto bruto" who="descrição do imóvel" done={STEPS[1].done(p)} />
        <p className="mb-2 text-xs text-ink-muted">Descrição do imóvel em texto livre, do jeito que vier. Depois esses dados viram a ficha completa e atraente que aparece no site.</p>
        <TextArea label="" value={p.textoBruto} onChange={(v) => update(i, { ...p, textoBruto: v })} />
      </div>

      {/* Proprietário */}
      <div className="rounded-lg border border-black/10 bg-white p-3">
        <span className="mb-2 block text-sm font-semibold text-ink-secondary">Proprietário</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" value={p.proprietario?.nome} onChange={(v) => update(i, { ...p, proprietario: { ...(p.proprietario || {}), nome: v } })} />
          <Field label="Contato (telefone/WhatsApp)" value={p.proprietario?.contato} onChange={(v) => update(i, { ...p, proprietario: { ...(p.proprietario || {}), contato: v } })} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-secondary">
          <input type="checkbox" checked={!!p.proprietario?.exclusividade} onChange={(e) => update(i, { ...p, proprietario: { ...(p.proprietario || {}), exclusividade: e.target.checked } })} className="h-4 w-4 accent-primary" />
          Contrato de exclusividade com o corretor
        </label>
      </div>

      {/* Divulgação */}
      <div className="rounded-lg border border-black/10 bg-white p-3">
        <span className="mb-1 block text-sm font-semibold text-ink-secondary">Divulgação <span className="font-normal text-ink-muted">({distribCount(p)}/{DISTRIBUICAO_ITENS.length})</span></span>
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

      {/* Passo 3 · Ficha do site */}
      <div className="rounded-lg border border-primary/40 bg-primary/[0.05] p-3">
        <StepHeader n={3} emoji="📋" title="Ficha do site" who="o que aparece publicado" done={STEPS[2].done(p)} />
        <p className="text-xs text-ink-muted">Preencha os campos abaixo · é exatamente o que vai aparecer na página do imóvel.</p>
      </div>

      {/* Capa / destaque na home */}
      <div className="rounded-lg bg-black/[0.03] p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-start gap-2 rounded-md border border-black/10 bg-white p-2.5 text-sm text-ink-secondary">
            <input type="checkbox" checked={!!p.cover} onChange={(e) => update(i, { ...p, cover: e.target.checked })} className="mt-0.5 h-4 w-4 accent-primary" />
            <span><strong>🏠 Capa da home (topo)</strong><span className="block text-xs text-ink-muted">Aparece no carrossel grande do topo. Marque em 2+ imóveis para girar.</span></span>
          </label>
          <label className="flex items-start gap-2 rounded-md border border-black/10 bg-white p-2.5 text-sm text-ink-secondary">
            <input type="checkbox" checked={!!p.featured} onChange={(e) => update(i, { ...p, featured: e.target.checked })} className="mt-0.5 h-4 w-4 accent-primary" />
            <span><strong>⭐ Destaque</strong><span className="block text-xs text-ink-muted">Aparece na seção “Destaques em imóveis”, mais abaixo na home.</span></span>
          </label>
        </div>
        {p.cover && (
          <p className="mt-2 text-xs text-primary-dark">Este imóvel está na <strong>capa</strong>. Escolha a <strong>foto de capa</strong> nas imagens (botão “Definir capa”). O tempo do carrossel fica na aba “Capa”.</p>
        )}
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

      <button onClick={() => remove(i)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Excluir imóvel</button>
    </div>
  );
}

/* Grupo de filtro (chips). value "" = sem filtro; options = [{value,label}]. */
function FilterGroup({ label, value, onChange, options }) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button key={o.value} onClick={() => onChange(o.value)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? "bg-ink text-white" : "bg-black/5 text-ink-secondary hover:bg-black/10"}`}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function ImoveisTab({ properties, setProperties, data }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [filter, setFilter] = useState("all");
  const [respFilter, setRespFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [divulgacaoFilter, setDivulgacaoFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("lista");
  const [collapsed, setCollapsed] = useState({});
  const [dragIdx, setDragIdx] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [quickAdd, setQuickAdd] = useState(null);

  // Equipe e funil configuráveis (vêm do content; caem no fallback se vazios).
  const team = data?.team?.length ? data.team : DEFAULT_TEAM;
  const funnel = data?.funnel?.length ? data.funnel : DEFAULT_FUNNEL;
  const teamBy = Object.fromEntries(team.map((t) => [t.id, t]));
  const etapaValues = funnel.map((f) => f.id);
  const etapaLabel = Object.fromEntries(funnel.map((f) => [f.id, f.label]));
  const firstId = etapaValues[0];
  const lastId = etapaValues[etapaValues.length - 1];
  const prevId = etapaValues[etapaValues.length - 2] || firstId; // etapa anterior à última (p/ despublicar)
  // Colunas do Kanban = etapas do funil + Vendidos/Alugados (por situação).
  const columnsAll = [
    ...funnel.map((f, idx) => ({ kind: "stage", id: f.id, label: f.label, hint: f.hint, owner: f.owner, num: idx + 1 })),
    ...SPECIAL_COLS.map((s) => ({ kind: "special", ...s })),
  ];
  // Regra do fluxo: publicado ⇔ última etapa ("No site"). Publicado sempre cai nessa coluna;
  // rascunho fica na etapa de produção. Vendido/alugado vão p/ colunas próprias.
  function columnOf(p) {
    if (p.status === "vendido") return "__vendidos";
    if (p.status === "alugado") return "__alugados";
    if (p.publicado) return lastId;
    return etapaValues.includes(p.etapa) && p.etapa !== lastId ? p.etapa : firstId;
  }
  // Mover um imóvel para uma coluna (arrastar/setas). Especial = muda a situação;
  // etapa do funil = limpa vendido/alugado e aplica a regra de publicação.
  function moveToColumn(i, col) {
    const p = properties[i];
    if (!col) return;
    if (col.kind === "special") {
      update(i, { ...p, status: col.status });
    } else {
      const status = p.status === "vendido" || p.status === "alugado" ? "disponivel" : p.status;
      update(i, { ...p, etapa: col.id, publicado: col.id === lastId, status });
    }
  }

  function isVisible(p) {
    if (respFilter && p.responsavel !== respFilter) return false;
    if (statusFilter && (p.status || "disponivel") !== statusFilter) return false;
    if (etapaFilter && (p.etapa || "") !== etapaFilter) return false;
    if (typeFilter && p.type !== typeFilter) return false;
    if (divulgacaoFilter) {
      // "!chave" = quero ver os que NÃO têm; "chave" = os que já têm.
      const neg = divulgacaoFilter.startsWith("!");
      const key = neg ? divulgacaoFilter.slice(1) : divulgacaoFilter;
      const has = !!p.distribuicao?.[key];
      if (neg ? has : !has) return false;
    }
    if (filter === "rascunhos" && p.publicado) return false;
    if (filter === "publicados" && !p.publicado) return false;
    if (filter === "distrib_pendente" && !(p.publicado && DISTRIBUICAO_ITENS.some((it) => !p.distribuicao?.[it.key]))) return false;
    return true;
  }
  function clearFilters() { setFilter("all"); setRespFilter(""); setStatusFilter(""); setEtapaFilter(""); setTypeFilter(""); setDivulgacaoFilter(""); }
  function togglePublish(i, p) {
    // Publicar => última etapa ("No site"). Despublicar => sai da última etapa (volta uma).
    const pub = !p.publicado;
    update(i, { ...p, publicado: pub, etapa: pub ? lastId : (p.etapa === lastId ? prevId : p.etapa) });
  }
  function update(i, np) { const next = properties.slice(); next[i] = np; setProperties(next); }
  function remove(i) { if (!confirm("Excluir este imóvel?")) return; setProperties(properties.filter((_, idx) => idx !== i)); setOpenIdx(null); }
  function add() {
    // Entrada rápida: infos essenciais + fotos. O título e a ficha completa vêm depois.
    setQuickAdd({ type: "Apartamento", neighborhood: "", city: "São José dos Campos", operation: ["Venda"], price: 0, rentPrice: 0, exclusividade: false, textoBruto: "", images: [], driveFotos: "", driveVideo: "" });
  }
  function createFromQuick() {
    const qa = quickAdd;
    if (!qa || !qa.textoBruto?.trim()) return; // "Informações do imóvel" é obrigatório
    const code = nextCode(properties);
    const owner = funnel[0]?.owner || "";
    const np = {
      ...emptyProperty(code),
      etapa: firstId,
      responsavel: owner,
      type: qa.type || "Apartamento",
      neighborhood: qa.neighborhood || "",
      city: qa.city || "",
      operation: Array.isArray(qa.operation) && qa.operation.length ? qa.operation : ["Venda"],
      price: Number(qa.price) || 0,
      rentPrice: Number(qa.rentPrice) || 0,
      status: qa.exclusividade ? "exclusividade" : "disponivel",
      proprietario: { nome: "", contato: "", exclusividade: !!qa.exclusividade },
      textoBruto: qa.textoBruto || "",
      images: Array.isArray(qa.images) ? qa.images : [],
      driveLinks: { fotos: qa.driveFotos || "", video: qa.driveVideo || "" },
    };
    setProperties([np, ...properties]);
    setQuickAdd(null);
    // Volta a tela ao topo: o novo rascunho entra no início da lista/funil.
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    // Não abre o editor: o card entra como rascunho na lista/funil com o que veio da entrada rápida.
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= properties.length) return;
    const next = properties.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setProperties(next);
    if (openIdx === i) setOpenIdx(j);
    else if (openIdx === j) setOpenIdx(i);
  }

  // Reordenar só faz sentido na Lista completa (define a ordem da capa/destaques na home).
  const showReorder = view === "lista" && filter === "all" && !respFilter && !statusFilter && !etapaFilter && !typeFilter && !divulgacaoFilter && !query.trim();
  const q = query.trim().toLowerCase();
  const matchesQuery = (p) => propMatches(p, q);
  const rows = properties.map((p, i) => ({ p, i })).filter(({ p }) => isVisible(p) && matchesQuery(p));
  const isClosed = (p) => p.status === "vendido" || p.status === "alugado";
  const vendidos = rows.filter(({ p }) => p.status === "vendido");
  const alugados = rows.filter(({ p }) => p.status === "alugado");
  const rascunhos = rows.filter(({ p }) => !p.publicado && !isClosed(p));
  const noSite = rows.filter(({ p }) => p.publicado && !isClosed(p));
  const ordered = [
    ...rascunhos.map((r) => ({ ...r, g: "rascunho" })),
    ...noSite.map((r) => ({ ...r, g: "nosite" })),
    ...vendidos.map((r) => ({ ...r, g: "vendidos" })),
    ...alugados.map((r) => ({ ...r, g: "alugados" })),
  ];
  const GROUP_LABEL = { rascunho: "Rascunhos · em produção", nosite: "No site", vendidos: "Vendidos", alugados: "Alugados" };
  const groupCounts = { rascunho: rascunhos.length, nosite: noSite.length, vendidos: vendidos.length, alugados: alugados.length };
  const respCounts = team.reduce((a, r) => { a[r.id] = properties.filter((p) => p.responsavel === r.id).length; return a; }, {});

  // Opções dos grupos de filtro
  const situacaoOptions = [{ value: "", label: "Todas" }, ...STATUS_OPTIONS];
  const etapaFilterOptions = [{ value: "", label: "Todas" }, ...funnel.map((f) => ({ value: f.id, label: f.label }))];
  const typeFilterOptions = [{ value: "", label: "Todos" }, ...TYPES.map((t) => ({ value: t, label: t }))];
  const DIVULG_SHORT = { carrossel: "Carrossel", reels: "Reels", anuncio: "Anúncio" };
  const divulgacaoOptions = [
    { value: "", label: "Todas" },
    ...DISTRIBUICAO_ITENS.map((it) => ({ value: it.key, label: `✓ ${DIVULG_SHORT[it.key] || it.label}` })),
    ...DISTRIBUICAO_ITENS.map((it) => ({ value: `!${it.key}`, label: `✕ sem ${DIVULG_SHORT[it.key] || it.label}` })),
  ];
  const respFilterOptions = [{ value: "", label: "Todos" }, ...team.map((t) => ({ value: t.id, label: `${t.emoji} ${t.name} (${respCounts[t.id]})` }))];
  // Filtros ativos (para o contador e as pílulas removíveis)
  const activePills = [];
  if (filter !== "all") activePills.push({ key: "estado", label: FILTERS.find((f) => f.value === filter)?.label, clear: () => setFilter("all") });
  if (statusFilter) activePills.push({ key: "situacao", label: STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label, clear: () => setStatusFilter("") });
  if (etapaFilter) activePills.push({ key: "etapa", label: etapaLabel[etapaFilter] || etapaFilter, clear: () => setEtapaFilter("") });
  if (typeFilter) activePills.push({ key: "tipo", label: typeFilter, clear: () => setTypeFilter("") });
  if (divulgacaoFilter) { const neg = divulgacaoFilter.startsWith("!"); const dk = neg ? divulgacaoFilter.slice(1) : divulgacaoFilter; activePills.push({ key: "divulg", label: `Divulg: ${neg ? "sem " : ""}${DIVULG_SHORT[dk] || dk}`, clear: () => setDivulgacaoFilter("") }); }
  if (respFilter) activePills.push({ key: "resp", label: teamBy[respFilter]?.name || respFilter, clear: () => setRespFilter("") });
  const activeCount = activePills.length;

  return (
    <Card title={`Imóveis cadastrados (${properties.length})`}>
      {/* Cadastrar + busca + visão */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={add} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-ink-cta hover:bg-primary-hover">+ Cadastrar novo imóvel</button>
        <div className="relative min-w-[200px] flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar código, título ou bairro" className="h-10 w-full rounded-lg border border-inputborder pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-black/10">
          <button onClick={() => setView("lista")} className={`px-3 py-2 text-sm font-semibold transition-colors ${view === "lista" ? "bg-ink text-white" : "bg-white text-ink-secondary hover:bg-black/5"}`}>☰ Lista</button>
          <button onClick={() => setView("funil")} className={`px-3 py-2 text-sm font-semibold transition-colors ${view === "funil" ? "bg-ink text-white" : "bg-white text-ink-secondary hover:bg-black/5"}`}>▚ Funil</button>
          <button onClick={() => setView("capa")} className={`px-3 py-2 text-sm font-semibold transition-colors ${view === "capa" ? "bg-ink text-white" : "bg-white text-ink-secondary hover:bg-black/5"}`}>🏠 Vitrine do site</button>
        </div>
      </div>

      {/* Filtros (painel embutido) */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowFilters((s) => !s)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${showFilters || activeCount ? "border-ink bg-ink text-white" : "border-black/10 bg-white text-ink-secondary hover:bg-black/5"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
            Filtros
            {activeCount > 0 && <span className={`rounded-full px-1.5 text-[11px] font-bold ${showFilters || activeCount ? "bg-primary text-ink-cta" : "bg-ink text-white"}`}>{activeCount}</span>}
            <span className="text-[10px] opacity-70">{showFilters ? "▲" : "▼"}</span>
          </button>
          <span className="text-xs text-ink-muted">{rows.length} de {properties.length}</span>
          {activeCount > 0 && !showFilters && activePills.map((pill) => (
            <button key={pill.key} onClick={pill.clear} className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-ink-secondary hover:bg-black/10">
              {pill.label} <span className="text-ink-muted">✕</span>
            </button>
          ))}
          {activeCount > 0 && <button onClick={clearFilters} className="text-xs text-ink-muted underline hover:text-ink-secondary">Limpar</button>}
        </div>

        {showFilters && (
          <div className="mt-2 grid gap-4 rounded-xl border border-black/10 bg-black/[0.02] p-4 sm:grid-cols-2 lg:grid-cols-3">
            <FilterGroup label="Estado" value={filter} onChange={setFilter} options={FILTERS} />
            <FilterGroup label="Situação" value={statusFilter} onChange={setStatusFilter} options={situacaoOptions} />
            <FilterGroup label="Etapa do funil" value={etapaFilter} onChange={setEtapaFilter} options={etapaFilterOptions} />
            <FilterGroup label="Tipo de imóvel" value={typeFilter} onChange={setTypeFilter} options={typeFilterOptions} />
            <FilterGroup label="Divulgação" value={divulgacaoFilter} onChange={setDivulgacaoFilter} options={divulgacaoOptions} />
            <FilterGroup label="Responsável" value={respFilter} onChange={setRespFilter} options={respFilterOptions} />
          </div>
        )}
      </div>

      {view === "funil" ? (
        /* ===== KANBAN (funil de produção) ===== */
        <>
          <p className="mb-2 text-xs text-ink-muted">Arraste os cards entre as colunas · as duas últimas (<strong>Vendidos</strong>/<strong>Alugados</strong>) marcam o negócio fechado · clique num card para editar.</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columnsAll.map((col, idx) => {
              const owner = col.kind === "stage" ? teamBy[col.owner] : null;
              const accent = col.kind === "special" ? col.accent : owner?.color || "#94a3b8";
              const cards = rows.filter(({ p }) => columnOf(p) === col.id);
              const isOver = overCol === col.id;
              const cur = idx;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => { e.preventDefault(); if (overCol !== col.id) setOverCol(col.id); }}
                  onDrop={() => { if (dragIdx != null) moveToColumn(dragIdx, col); setDragIdx(null); setOverCol(null); }}
                  className={`flex w-[82vw] max-w-[300px] shrink-0 flex-col rounded-xl border transition-colors sm:w-[240px] sm:max-w-none ${isOver ? "border-primary bg-primary/5" : col.kind === "special" ? "border-black/10 bg-black/[0.04]" : "border-black/10 bg-black/[0.02]"}`}
                >
                  <div className="rounded-t-xl border-t-[3px] px-3 pb-2.5 pt-2" style={{ borderTopColor: accent }}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: accent }}>{col.kind === "special" ? col.emoji : col.num}</span>
                      <span className="text-[13px] font-semibold text-ink">{col.label}</span>
                      <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">{cards.length}</span>
                    </div>
                    {col.kind === "stage"
                      ? <div className="mt-1.5"><ResponsavelChip member={owner} size="xs" /></div>
                      : <div className="mt-1.5"><span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: accent }}>{col.status}</span></div>}
                    {col.hint && <p className="mt-1 text-[10px] leading-tight text-ink-muted">{col.hint}</p>}
                  </div>
                  <div className="flex-1 space-y-2 p-2">
                    {cards.length === 0 && <div className="rounded-lg border border-dashed border-black/10 py-6 text-center text-[11px] text-ink-muted">vazio</div>}
                    {cards.map(({ p, i }) => (
                      <KanbanCard
                        key={p.id || i}
                        p={p}
                        i={i}
                        active={dragIdx === i}
                        onOpen={() => setOpenIdx(i)}
                        onDelete={() => remove(i)}
                        onDragStart={() => setDragIdx(i)}
                        onDragEnd={() => { setDragIdx(null); setOverCol(null); }}
                        onMove={(dir) => { const t = cur + dir; if (t >= 0 && t < columnsAll.length) moveToColumn(i, columnsAll[t]); }}
                        canPrev={cur > 0}
                        canNext={cur < columnsAll.length - 1}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : view === "capa" ? (
        /* ===== CAPA & DESTAQUES ===== */
        <CapaDestaquesOrganizer properties={properties} setProperties={setProperties} onEdit={(idx) => setOpenIdx(idx)} q={q} />
      ) : (
        /* ===== LISTA ===== */
        <div className="space-y-3">
          {rows.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-muted p-8 text-center text-sm text-ink-muted">Nenhum imóvel neste filtro/busca.</div>
          )}
          {ordered.map((row, k) => {
            const { p, i, g } = row;
            const firstOfGroup = k === 0 || ordered[k - 1].g !== g;
            const groupCount = groupCounts[g];
            const isOpen = !collapsed[g];
            // Borda esquerda = estado (no ar vs rascunho). A situação já aparece no selo colorido.
            const borderColor = p.publicado ? "#4ecb5b" : "#ffa200";
            return (
              <Fragment key={p.id || i}>
                {firstOfGroup && (
                  <button type="button" onClick={() => setCollapsed((c) => ({ ...c, [g]: !c[g] }))} className="mt-2 flex w-full items-center gap-2 px-1 py-1 text-left first:mt-0">
                    <span className="text-ink-muted">{isOpen ? "▾" : "▸"}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">{GROUP_LABEL[g]}</span>
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">{groupCount}</span>
                  </button>
                )}
                {isOpen && (
                  <div className="group rounded-lg border border-black/10 bg-white border-l-4" style={{ borderLeftColor: borderColor }}>
                    <div className="flex w-full items-center gap-2 px-3 py-2.5 md:gap-3 md:px-4">
                      {showReorder && (
                        <div className="hidden shrink-0 flex-col md:flex md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                          <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima" className="flex h-5 w-6 items-center justify-center rounded text-ink-muted hover:bg-black/5 disabled:opacity-30">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 15l6-6 6 6" /></svg>
                          </button>
                          <button onClick={() => move(i, 1)} disabled={i === properties.length - 1} aria-label="Mover para baixo" className="flex h-5 w-6 items-center justify-center rounded text-ink-muted hover:bg-black/5 disabled:opacity-30">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                        </div>
                      )}

                      <button onClick={() => setOpenIdx(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (<span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-black/5 text-ink-muted">🏠</span>)}
                        <span className="min-w-0 flex-1">
                          {(() => { const lbl = cardLabel(p); return (
                          <span className={`block truncate text-sm font-semibold ${lbl.isPlaceholder ? "italic text-ink-muted" : "text-ink"}`}>{lbl.text}</span>
                          ); })()}
                          <span className="block truncate text-xs text-ink-muted">Cód {p.code} · {p.type}{p.neighborhood ? ` · ${p.neighborhood}` : ""}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5">
                            {(p.price > 0 || p.rentPrice > 0) && <span className="text-xs font-bold text-primary-dark">{p.price > 0 ? formatBRL(p.price) : `${formatBRL(p.rentPrice)}/mês`}</span>}
                            <SituacaoBadge status={p.status} />
                            {p.publicado
                              ? <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8ea] px-1.5 py-0.5 text-[10px] font-semibold text-[#2fa03c]"><span className="h-1.5 w-1.5 rounded-full bg-[#4ecb5b]" />no ar</span>
                              : <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3e0] px-1.5 py-0.5 text-[10px] font-semibold text-[#b7791f]"><span className="h-1.5 w-1.5 rounded-full bg-[#ffa200]" />rascunho</span>}
                          </span>
                        </span>
                      </button>

                      <span className="hidden shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium text-ink-secondary md:inline-block">
                        {p.status === "vendido" ? "💰 Vendido" : p.status === "alugado" ? "🔑 Alugado" : p.publicado ? (etapaLabel[lastId] || "No site") : (etapaLabel[p.etapa] || p.etapa || "Captação")}
                      </span>
                      <button onClick={() => togglePublish(i, p)} className={`hidden shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors md:inline-block ${p.publicado ? "bg-black/5 text-ink-secondary hover:bg-black/10" : "bg-primary text-ink-cta hover:bg-primary-hover"}`}>{p.publicado ? "Despublicar" : "Publicar"}</button>
                      <RowMenu onEdit={() => setOpenIdx(i)} onDelete={() => remove(i)} />
                    </div>
                    {(p.cover || p.featured) && (
                      <div className="flex items-center gap-1.5 border-t border-black/5 px-3 py-1.5 md:px-4">
                        {p.cover && <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-ink-secondary">🏠 Capa</span>}
                        {p.featured && <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-ink-secondary">⭐ Destaque</span>}
                      </div>
                    )}
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      )}

      {/* Editor em painel lateral (todas as visões) */}
      {openIdx != null && properties[openIdx] && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setOpenIdx(null)}>
          <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <span className="truncate text-sm font-semibold text-ink">{properties[openIdx].title || "Novo imóvel"} <span className="font-normal text-ink-muted">· Cód {properties[openIdx].code}</span></span>
              <button onClick={() => setOpenIdx(null)} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-black/5">✕ Fechar</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <PropertyEditor p={properties[openIdx]} i={openIdx} update={update} remove={remove} team={team} funnel={funnel} />
            </div>
          </div>
        </div>
      )}

      {/* Entrada rápida de imóvel (infos básicas + upload de fotos e/ou Drive) */}
      {quickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setQuickAdd(null)}>
          <div className="my-auto flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5">
              <h3 className="text-base font-semibold text-ink">Novo imóvel · entrada rápida</h3>
              <button onClick={() => setQuickAdd(null)} className="rounded-lg px-2 py-1 text-sm text-ink-secondary hover:bg-black/5">✕</button>
            </div>
            <p className="px-5 pb-1 pt-1 text-xs text-ink-muted">Preencha o essencial. O título e a ficha completa do site você ajusta depois, no editor do imóvel.</p>
            <div className="min-w-0 flex-1 space-y-3 overflow-y-auto px-5 py-3">
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Tipo" value={quickAdd.type} options={TYPES} onChange={(v) => setQuickAdd({ ...quickAdd, type: v })} />
                <Field label="Bairro" value={quickAdd.neighborhood} onChange={(v) => setQuickAdd({ ...quickAdd, neighborhood: v })} />
              </div>
              <Field label="Cidade" value={quickAdd.city} onChange={(v) => setQuickAdd({ ...quickAdd, city: v })} />

              {/* Operação + valor do imóvel */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-ink-secondary">Operação</span>
                  <div className="flex flex-wrap gap-2">
                    {["Venda", "Aluguel"].map((op) => {
                      const on = (quickAdd.operation || []).includes(op);
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => { const set = new Set(quickAdd.operation || []); on ? set.delete(op) : set.add(op); setQuickAdd({ ...quickAdd, operation: [...set] }); }}
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${on ? "border-primary bg-primary text-ink-cta" : "border-black/10 bg-white text-ink-secondary hover:bg-black/5"}`}
                        >{op === "Aluguel" ? "Locação (aluguel)" : "Venda"}</button>
                      );
                    })}
                  </div>
                </div>
                {/* Valor: aparece conforme a operação (venda e/ou aluguel) */}
                <div className="space-y-2">
                  {((quickAdd.operation || []).includes("Venda") || !(quickAdd.operation || []).length) && (
                    <NumberField label="Valor de venda (R$)" value={quickAdd.price} onChange={(v) => setQuickAdd({ ...quickAdd, price: v })} />
                  )}
                  {(quickAdd.operation || []).includes("Aluguel") && (
                    <NumberField label="Valor do aluguel (R$/mês)" value={quickAdd.rentPrice} onChange={(v) => setQuickAdd({ ...quickAdd, rentPrice: v })} />
                  )}
                </div>
              </div>

              {/* Exclusividade */}
              <label className="flex items-start gap-2 rounded-lg border border-black/10 bg-black/[0.02] p-3 text-sm text-ink-secondary">
                <input type="checkbox" checked={!!quickAdd.exclusividade} onChange={(e) => setQuickAdd({ ...quickAdd, exclusividade: e.target.checked })} className="mt-0.5 h-4 w-4 accent-primary" />
                <span><strong>Imóvel exclusivo</strong><span className="block text-xs text-ink-muted">Exclusivo da corretora (nenhuma outra pessoa/corretora trabalha nele). Mostra o selo EXCLUSIVIDADE no site.</span></span>
              </label>

              {/* Informações do imóvel (obrigatório) */}
              <div>
                <TextArea label="Informações do imóvel *" value={quickAdd.textoBruto} onChange={(v) => setQuickAdd({ ...quickAdd, textoBruto: v })} />
                <p className="mt-1 text-xs text-ink-muted">Descrição solta do imóvel, do jeito que vier (quartos, metragem, valor, diferenciais…). <strong>Obrigatório.</strong> Depois vira a ficha completa do site.</p>
              </div>

              {/* Upload direto das fotos (vai direto pro site, sem baixar do Drive) */}
              <div className="min-w-0 overflow-hidden rounded-lg border border-black/10 bg-black/[0.02] p-3">
                <MultiImageField images={quickAdd.images || []} onChange={(imgs) => setQuickAdd({ ...quickAdd, images: imgs })} showCover={false} coverImage="" onSetCover={() => {}} />
              </div>

              <details className="rounded-lg border border-black/10 bg-white p-3">
                <summary className="cursor-pointer text-sm font-medium text-ink-secondary">Links do Drive (opcional)</summary>
                <div className="mt-3 space-y-3">
                  <DriveLinkField label="Link da pasta de fotos (Drive)" value={quickAdd.driveFotos} onChange={(v) => setQuickAdd({ ...quickAdd, driveFotos: v })} />
                  <DriveLinkField label="Link do vídeo (Drive)" value={quickAdd.driveVideo} onChange={(v) => setQuickAdd({ ...quickAdd, driveVideo: v })} />
                </div>
              </details>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-black/10 px-5 py-4">
              <button onClick={() => setQuickAdd(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-black/5">Cancelar</button>
              <button onClick={createFromQuick} disabled={!quickAdd.textoBruto?.trim()} title={!quickAdd.textoBruto?.trim() ? "Preencha as informações do imóvel" : undefined} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-ink-cta hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">Criar imóvel</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ===================== CAPA & DESTAQUES (organizar) ===================== */

function CapaDestaquesOrganizer({ properties, setProperties, onEdit, q = "" }) {
  const upd = (i, np) => { const n = properties.slice(); n[i] = np; setProperties(n); };
  const withIdx = properties.map((p, i) => ({ p, i }));
  const hit = (x) => propMatches(x.p, q); // respeita a busca do topo (título, texto bruto, etc.)
  // Capa e Destaques têm ORDEM PRÓPRIA (coverOrder / featuredOrder). Reordenar uma não
  // mexe na outra nem na listagem — cada lista é ordenada pelo seu campo.
  const bySort = (field) => (a, b) => (a.p[field] ?? a.i) - (b.p[field] ?? b.i);
  // Listas COMPLETAS (para reordenar/adicionar com a ordem correta) e as exibidas (com a busca).
  const coversAll = withIdx.filter((x) => x.p.cover).sort(bySort("coverOrder"));
  const featsAll = withIdx.filter((x) => x.p.featured).sort(bySort("featuredOrder"));
  const publishedAll = withIdx.filter((x) => x.p.publicado); // listagem segue a ordem do array
  const covers = coversAll.filter(hit);
  const feats = featsAll.filter(hit);
  const published = publishedAll.filter(hit);

  // Reordena uma vitrine reescrevendo SÓ o seu campo de ordem (0..n-1) na sequência mostrada.
  const moveByField = (sortedItems, field, subIndex, dir) => {
    const j = subIndex + dir;
    if (j < 0 || j >= sortedItems.length) return;
    const order = sortedItems.map((x) => x.i);
    [order[subIndex], order[j]] = [order[j], order[subIndex]];
    const n = properties.slice();
    order.forEach((globalIdx, pos) => { n[globalIdx] = { ...n[globalIdx], [field]: pos }; });
    setProperties(n);
  };
  // A listagem reordena trocando posições no array (é a ordem que o site usa por padrão).
  const moveInArray = (subIndex, dir) => {
    const idxs = publishedAll.map((x) => x.i);
    const a = idxs[subIndex], b = idxs[subIndex + dir];
    if (a == null || b == null) return;
    const n = properties.slice();
    [n[a], n[b]] = [n[b], n[a]];
    setProperties(n);
  };
  // Ao adicionar numa vitrine, entra no FIM da lista (maior ordem + 1).
  const addTo = (i, flag, field, list) => {
    const maxOrder = list.reduce((m, x) => Math.max(m, x.p[field] ?? x.i), -1);
    upd(i, { ...properties[i], [flag]: true, [field]: maxOrder + 1 });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <OrganizerColumn
          title="🏠 Capa da home"
          accent="#EFB810"
          hint="Carrossel grande do topo do site. A ordem aqui é a ordem em que giram. (A foto de capa de cada um é escolhida no editor.)"
          items={covers}
          candidates={withIdx.filter((x) => !x.p.cover)}
          onUp={(k) => moveByField(coversAll, "coverOrder", k, -1)}
          onDown={(k) => moveByField(coversAll, "coverOrder", k, 1)}
          onRemove={(i) => upd(i, { ...properties[i], cover: false })}
          onAdd={(i) => addTo(i, "cover", "coverOrder", coversAll)}
          onEdit={onEdit}
          searching={!!q}
        />
        <OrganizerColumn
          title="⭐ Destaques"
          accent="#4f46e5"
          hint="Seção “Destaques em imóveis” da home. Mostra até 8, na ordem abaixo."
          items={feats}
          candidates={withIdx.filter((x) => !x.p.featured)}
          onUp={(k) => moveByField(featsAll, "featuredOrder", k, -1)}
          onDown={(k) => moveByField(featsAll, "featuredOrder", k, 1)}
          onRemove={(i) => upd(i, { ...properties[i], featured: false })}
          onAdd={(i) => addTo(i, "featured", "featuredOrder", featsAll)}
          onEdit={onEdit}
          searching={!!q}
        />
      </div>
      <OrganizerColumn
        title="📄 Ordem na listagem do site"
        accent="#0ea5e9"
        hint="Ordem em que os imóveis publicados aparecem na página “Imóveis” do site (ordenação padrão). O visitante ainda pode reordenar por preço/área."
        items={published}
        onUp={(k) => moveInArray(k, -1)}
        onDown={(k) => moveInArray(k, 1)}
        onEdit={onEdit}
        searching={!!q}
      />
    </div>
  );
}

function OrganizerColumn({ title, accent, hint, items, candidates, onUp, onDown, onRemove, onAdd, onEdit, searching = false }) {
  const arrow = "flex h-5 w-6 items-center justify-center rounded text-ink-muted hover:bg-black/5 disabled:opacity-25";
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-black/10 bg-white p-4" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="mb-1 flex items-center gap-2">
        <h3 className="font-poppins text-base font-semibold text-ink">{title}</h3>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">{items.length}</span>
      </div>
      <p className="mb-3 text-xs text-ink-muted">{hint}</p>
      {searching && items.length > 0 && <p className="mb-2 text-[11px] text-ink-muted">Resultados da busca — limpe a busca para reordenar.</p>}
      <div className="space-y-2">
        {items.length === 0 && <div className="rounded-lg border border-dashed border-black/15 p-5 text-center text-xs text-ink-muted">{searching ? "Nenhum resultado para a busca." : "Nenhum imóvel aqui ainda. Adicione abaixo."}</div>}
        {items.map(({ p, i }, k) => (
          <div key={p.id || i} className="flex min-w-0 items-center gap-2 rounded-lg border border-black/10 p-2">
            <div className="flex shrink-0 flex-col">
              <button onClick={() => onUp(k)} disabled={searching || k === 0} aria-label="Subir" className={arrow}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 15l6-6 6 6" /></svg></button>
              <button onClick={() => onDown(k)} disabled={searching || k === items.length - 1} aria-label="Descer" className={arrow}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg></button>
            </div>
            {p.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt="" className="h-11 w-16 shrink-0 rounded object-cover" />
            ) : (<span className="flex h-11 w-16 shrink-0 items-center justify-center rounded bg-black/5 text-ink-muted">🏠</span>)}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{p.title || "(sem título)"}</div>
              <div className="truncate text-xs text-ink-muted">Cód {p.code}{p.neighborhood ? ` · ${p.neighborhood}` : ""}{!p.publicado ? " · rascunho" : ""}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {p.price > 0 && <span className="text-xs font-bold text-primary-dark">{formatBRL(p.price)}<span className="font-medium text-ink-muted"> · venda</span></span>}
                {p.rentPrice > 0 && <span className="text-xs font-bold text-primary-dark">{formatBRL(p.rentPrice)}/mês<span className="font-medium text-ink-muted"> · aluguel</span></span>}
                <SituacaoBadge status={p.status} />
              </div>
            </div>
            <button onClick={() => onEdit(i)} title="Editar" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-secondary hover:bg-black/5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg></button>
            {onRemove && <button onClick={() => onRemove(i)} title="Remover daqui" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-black/5 hover:text-red-600"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg></button>}
          </div>
        ))}
      </div>
      {onAdd && (
        <select
          value=""
          onChange={(e) => { const idx = Number(e.target.value); if (e.target.value !== "" && !Number.isNaN(idx)) onAdd(idx); }}
          className="mt-3 h-10 w-full rounded-lg border border-inputborder px-2 text-sm outline-none focus:border-primary"
        >
          <option value="">+ Adicionar imóvel...</option>
          {(candidates || []).map(({ p, i }) => <option key={p.id || i} value={i}>{p.code} · {p.title || "(sem título)"}</option>)}
        </select>
      )}
    </div>
  );
}

/* ===================== TEMPLATES (galeria de temas) ===================== */

// Registro de templates do site. "classico" = o layout original. Novos layouts entram aqui
// e são escolhidos pelo campo content.template (consumido pelo site em app/page.js).
// `features` alimenta a Visão geral e vira atalho para a sub-aba correspondente.
const TEMPLATES = [
  {
    id: "classico",
    name: "Clássico",
    tagline: "layout original",
    desc: "Elegante e sofisticado, com carrossel de capa em tela cheia e foco total nos imóveis.",
    features: [
      { label: "Marca, cores e SEO", sub: "marca" },
      { label: "Menu, WhatsApp e redes", sub: "menu" },
      { label: "Carrossel de capa no topo", sub: "capa" },
      { label: "Sobre, destaques e bairros", sub: "secoes" },
      { label: "Formulário de contato", sub: "form" },
      { label: "Rodapé completo", sub: "rodape" },
    ],
    available: true,
    mock: "classico",
  },
  { id: "moderno", name: "Moderno", tagline: "em breve", desc: "Layout amplo e minimalista, com fotos grandes e tipografia forte.", features: [], available: false, accent: "#0f172a", mock: "moderno" },
  { id: "vitrine", name: "Vitrine", tagline: "em breve", desc: "Home em grade de destaques, pensada para muitos imóveis e busca rápida.", features: [], available: false, accent: "#0ea5e9", mock: "vitrine" },
];

// Mini mockup do site, com uma variante por template (vende o conceito de cada layout).
function TemplateMock({ variant = "classico", accent = "#94a3b8" }) {
  if (variant === "moderno") {
    return (
      <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-black/10 bg-[#0f172a] shadow-inner">
        <div className="flex h-5 items-center justify-between px-2">
          <span className="h-1.5 w-8 rounded-full bg-white/80" />
          <span className="h-1 w-10 rounded bg-white/25" />
        </div>
        <div className="mx-2 h-12 rounded bg-gradient-to-br from-white/20 to-white/5" />
        <div className="mx-2 mt-1.5 h-2 w-1/2 rounded bg-white/90" />
        <div className="mx-2 mt-1 h-1 w-1/3 rounded bg-white/30" />
        <div className="mt-2 grid grid-cols-2 gap-1.5 px-2">
          {[0, 1].map((k) => <div key={k} className="h-8 rounded bg-white/10" />)}
        </div>
      </div>
    );
  }
  if (variant === "vitrine") {
    return (
      <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-inner">
        <div className="flex h-5 items-center gap-1.5 px-2">
          <span className="h-1.5 w-6 shrink-0 rounded-full" style={{ background: accent }} />
          <span className="h-2 flex-1 rounded-full bg-black/10" />
          <span className="h-2 w-6 shrink-0 rounded-full" style={{ background: accent }} />
        </div>
        <div className="mt-1 grid grid-cols-4 gap-1 px-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <div key={k} className="overflow-hidden rounded bg-black/[0.03]">
              <div className="h-5 bg-black/10" />
              <div className="m-0.5 h-1 rounded" style={{ background: accent }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-inner">
      <div className="flex h-5 items-center justify-between px-2">
        <div className="h-1.5 w-8 rounded-full" style={{ background: accent }} />
        <div className="flex items-center gap-1">
          <span className="h-1 w-3 rounded bg-black/15" />
          <span className="h-1 w-3 rounded bg-black/15" />
          <span className="h-1.5 w-5 rounded-full" style={{ background: accent }} />
        </div>
      </div>
      <div className="mx-2 h-10 rounded" style={{ background: `linear-gradient(135deg, ${accent}44, ${accent}11)` }} />
      <div className="relative">
        <div className="absolute inset-x-4 -top-2 h-3 rounded-full bg-white shadow ring-1 ring-black/10" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 px-2">
        {[0, 1, 2].map((k) => (
          <div key={k} className="overflow-hidden rounded bg-black/[0.03]">
            <div className="h-6 bg-black/10" />
            <div className="space-y-0.5 p-1">
              <div className="h-1 w-full rounded bg-black/10" />
              <div className="h-1 w-2/3 rounded" style={{ background: accent }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Prévia real do site (iframe reduzido). `scale` controla a largura lógica renderizada
   (menor = mais "desktop"); `refreshKey` recarrega; skeleton enquanto carrega. */
function SitePreview({ className = "", scale = 0.4, refreshKey = 0 }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); }, [refreshKey]);
  return (
    <div className={`relative overflow-hidden bg-black/[0.04] ${className}`}>
      {!loaded && (
        <div aria-hidden className="absolute inset-0 animate-pulse p-3">
          <div className="h-10 rounded-lg bg-black/10" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((k) => <div key={k} className="h-12 rounded-lg bg-black/10" />)}
          </div>
        </div>
      )}
      <iframe
        key={refreshKey}
        src="/"
        title="Prévia do site"
        loading="lazy"
        aria-hidden="true"
        scrolling="no"
        tabIndex={-1}
        onLoad={() => setLoaded(true)}
        className={`pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        style={{ width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})` }}
      />
    </div>
  );
}

function TemplatesTab({ data, patch, setSection, nav, setNav, notify }) {
  const current = data.template || "classico";
  const openTpl = TEMPLATES.find((t) => t.id === nav.openId);
  const activate = (id) => {
    setSection("template", id);
    notify?.({ type: "ok", text: "Template ativado. Clique em Salvar (no topo) para publicar." });
  };
  if (openTpl) {
    return (
      <TemplateDetail
        tpl={openTpl}
        active={current === openTpl.id}
        data={data}
        patch={patch}
        setSection={setSection}
        sub={nav.sub}
        setSub={(s) => setNav({ ...nav, sub: s })}
        onBack={() => setNav({ openId: null, sub: "visao" })}
        onActivate={() => activate(openTpl.id)}
      />
    );
  }
  return (
    <Card title="Templates do site">
      <p className="-mt-2 text-sm text-ink-muted">Escolha o visual do seu site, como uma loja de temas. Ao trocar de template, <strong>todo o seu conteúdo é mantido</strong> (imóveis, marca, cores, textos, contatos): muda só o layout. Os textos, cores e seções são um conteúdo só e acompanham você em qualquer template.</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => {
          const accent = t.id === "classico" ? (data.colors?.primary || "#F6BC41") : (t.accent || "#111827");
          const active = current === t.id;
          return (
            <div key={t.id} className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition ${active ? "border-primary ring-2 ring-primary/30" : "border-black/10"} ${t.available ? "hover:-translate-y-0.5 hover:shadow-md" : ""}`}>
              <div className="relative p-3">
                {active
                  ? <SitePreview className="aspect-[16/10] w-full rounded-lg border border-black/10" scale={0.25} />
                  : <div className={t.available ? "" : "opacity-70 saturate-[.65]"}><TemplateMock variant={t.mock} accent={accent} /></div>}
                {t.available && (
                  <button
                    type="button"
                    onClick={() => setNav({ openId: t.id, sub: "visao" })}
                    aria-label={`Abrir template ${t.name}`}
                    className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                  />
                )}
                {active && <span className="pointer-events-none absolute right-4 top-4 z-20 select-none rounded-full bg-[#16a34a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/30">✓ Ativo</span>}
                {!active && !t.available && <span className="pointer-events-none absolute right-4 top-4 z-20 select-none rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">Em breve</span>}
              </div>
              <div className="flex flex-1 flex-col px-4 pb-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-poppins text-base font-semibold text-ink">{t.name}</h3>
                  <span className="text-xs text-ink-muted">· {active ? "no ar" : t.tagline}</span>
                </div>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-muted">{t.desc}</p>
                <div className="mt-3 flex gap-2">
                  {t.available ? (
                    <>
                      <button onClick={() => setNav({ openId: t.id, sub: "visao" })} className="flex-1 rounded-lg bg-ink py-2 text-sm font-semibold text-white hover:bg-ink-secondary">{active ? "Personalizar" : "Ver e personalizar"}</button>
                      {!active && <button onClick={() => activate(t.id)} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-ink-cta hover:bg-primary-hover">Ativar</button>}
                    </>
                  ) : (
                    <button disabled className="flex-1 cursor-default rounded-lg border border-dashed border-black/15 py-2 text-sm font-medium text-ink-muted">Em breve</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* Detalhe do template: prévia (desktop/celular) + saber mais + personalização embutida.
   A navegação (sub) vem de cima (AdminForm) para sobreviver à troca de abas do painel. */
function TemplateDetail({ tpl, active, data, patch, setSection, sub, setSub, onBack, onActivate }) {
  const [device, setDevice] = useState("desktop");
  const [rev, setRev] = useState(0);
  // Ordem segue o site de cima a baixo; Marca & Cores é transversal e vem primeiro.
  const SUBS = [
    { id: "visao", label: "Visão geral" },
    { id: "marca", label: "Marca & Cores" },
    { id: "menu", label: "Menu & Contato" },
    { id: "capa", label: "Capa" },
    { id: "secoes", label: "Seções da Home" },
    { id: "form", label: "Formulário" },
    { id: "rodape", label: "Rodapé" },
  ];
  const deviceBtn = (id, label) => (
    <button
      type="button"
      aria-pressed={device === id}
      onClick={() => setDevice(id)}
      className={`px-3 py-1.5 text-sm font-semibold transition-colors ${device === id ? "bg-ink text-white" : "bg-white text-ink-secondary hover:bg-black/5"}`}
    >{label}</button>
  );
  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-black/5">← Templates</button>
        <h2 className="font-poppins text-lg font-semibold text-ink">Template {tpl.name}</h2>
        {active
          ? <span className="select-none rounded-full bg-[#16a34a] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/30">✓ Ativo</span>
          : <button onClick={onActivate} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-ink-cta hover:bg-primary-hover">Ativar este template</button>}
        <a href="/" target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-black/5">Ver site <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M9 7h8v8" /></svg></a>
      </div>

      {/* Sub-abas (roláveis no celular) */}
      <div role="tablist" aria-label="Personalização do template" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto border-b border-black/10 px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
        {SUBS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={sub === s.id}
            onClick={() => setSub(s.id)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${sub === s.id ? "bg-ink text-white" : "text-ink-secondary hover:bg-black/5"}`}
          >{s.label}</button>
        ))}
      </div>

      {/* Editando conteúdo com o template inativo: o conteúdo é compartilhado */}
      {!active && sub !== "visao" && (
        <p className="rounded-lg border border-[#ffa200]/40 bg-[#fff8ec] p-3 text-xs text-[#8a5a00]">Este template não está ativo. O conteúdo editado aqui é compartilhado e também vale para o template que está no ar.</p>
      )}

      {sub === "visao" && (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Prévia com modo desktop/celular e atualização */}
          <div className="rounded-xl border border-black/10 bg-white p-3">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Modo de visualização" className="inline-flex overflow-hidden rounded-lg border border-black/10">
                {deviceBtn("desktop", "🖥️ Computador")}
                {deviceBtn("mobile", "📱 Celular")}
              </div>
              <button type="button" onClick={() => setRev((r) => r + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-black/5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" /></svg>
                Atualizar prévia
              </button>
            </div>
            {device === "desktop" ? (
              <SitePreview className="aspect-[16/10] w-full rounded-lg border border-black/10" scale={0.5} refreshKey={rev} />
            ) : (
              <div className="mx-auto w-[250px] overflow-hidden rounded-[20px] border-[6px] border-ink/90 shadow-md">
                <SitePreview className="aspect-[9/18] w-full" scale={0.62} refreshKey={rev} />
              </div>
            )}
            <p className="mt-2 text-xs text-ink-muted">A prévia mostra o site publicado. Depois de clicar em <strong>Salvar</strong> (no topo), use “Atualizar prévia” para ver as mudanças.</p>
          </div>

          {/* Sobre + atalhos de personalização */}
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <h3 className="font-poppins text-base font-semibold text-ink">Sobre o {tpl.name}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{tpl.desc}</p>
            {tpl.features?.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">O que você personaliza</p>
                <ul className="mt-1.5 space-y-0.5">
                  {tpl.features.map((f) => (
                    <li key={f.sub}>
                      <button type="button" onClick={() => setSub(f.sub)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-secondary transition-colors hover:bg-black/5">
                        <span>{f.label}</span>
                        <span className="shrink-0 text-xs font-semibold text-primary-dark">Editar →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <a href="/" target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-white py-2 text-sm font-medium text-ink-secondary hover:bg-black/5">
              Ver site em tela cheia
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </a>
          </div>
        </div>
      )}
      {sub === "marca" && <MarcaTab data={data} patch={patch} />}
      {sub === "menu" && <MenuTab data={data} patch={patch} setSection={setSection} />}
      {sub === "capa" && <CapaTab data={data} patch={patch} />}
      {sub === "secoes" && <SecoesTab data={data} patch={patch} setSection={setSection} />}
      {sub === "form" && <FormTab data={data} patch={patch} />}
      {sub === "rodape" && <RodapeTab data={data} patch={patch} />}
    </div>
  );
}

/* ===================== EQUIPE & FUNIL ===================== */

function EquipeTab({ data, setSection }) {
  const team = Array.isArray(data.team) ? data.team : [];
  const funnel = Array.isArray(data.funnel) ? data.funnel : [];
  const newId = (prefix) => prefix + Math.random().toString(36).slice(2, 8);
  const arrowBtn = "flex h-7 w-7 items-center justify-center rounded border border-black/10 text-ink-muted hover:bg-black/5 disabled:opacity-30";

  // Equipe
  const updTeam = (i, m) => { const n = team.slice(); n[i] = m; setSection("team", n); };
  const addTeam = () => setSection("team", [...team, { id: newId("m_"), name: "", role: "", emoji: "🙂", color: "#4f46e5" }]);
  const moveTeam = (i, d) => { const j = i + d; if (j < 0 || j >= team.length) return; const n = team.slice(); [n[i], n[j]] = [n[j], n[i]]; setSection("team", n); };
  const delTeam = (i) => { if (!confirm(`Remover “${team[i]?.name || "membro"}” da equipe? Imóveis com esse responsável ficarão “sem responsável”.`)) return; setSection("team", team.filter((_, idx) => idx !== i)); };

  // Funil
  const updFun = (i, s) => { const n = funnel.slice(); n[i] = s; setSection("funnel", n); };
  const addFun = () => setSection("funnel", [...funnel, { id: newId("e_"), label: "Nova etapa", owner: team[0]?.id || "", hint: "" }]);
  const moveFun = (i, d) => { const j = i + d; if (j < 0 || j >= funnel.length) return; const n = funnel.slice(); [n[i], n[j]] = [n[j], n[i]]; setSection("funnel", n); };
  const delFun = (i) => { if (funnel.length <= 1) { alert("O funil precisa de pelo menos uma etapa."); return; } if (!confirm("Remover esta etapa? Imóveis nela voltam para a primeira coluna.")) return; setSection("funnel", funnel.filter((_, idx) => idx !== i)); };

  return (
    <>
      <Card title="Equipe (responsáveis do Kanban)">
        <p className="-mt-2 text-xs text-ink-muted">Estas pessoas viram as opções de <strong>Responsável</strong> nos imóveis e os donos das etapas. Cor e emoji formam o chip colorido.</p>
        <div className="space-y-3">
          {team.map((m, i) => (
            <div key={m.id || i} className="rounded-lg border border-black/10 p-3">
              <div className="mb-2 flex items-center gap-2">
                <ResponsavelChip member={m} />
                <span className="text-xs text-ink-muted">{m.role}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => moveTeam(i, -1)} disabled={i === 0} className={arrowBtn}>▲</button>
                  <button onClick={() => moveTeam(i, 1)} disabled={i === team.length - 1} className={arrowBtn}>▼</button>
                  <button onClick={() => delTeam(i)} className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Excluir</button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                <Mini label="Nome" value={m.name} onChange={(v) => updTeam(i, { ...m, name: v })} />
                <Mini label="Função" value={m.role} onChange={(v) => updTeam(i, { ...m, role: v })} />
                <Mini label="Emoji" value={m.emoji} onChange={(v) => updTeam(i, { ...m, emoji: v })} />
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Cor</span>
                  <span className="flex items-center gap-2">
                    <input type="color" value={m.color || "#4f46e5"} onChange={(e) => updTeam(i, { ...m, color: e.target.value })} className="h-10 w-12 cursor-pointer rounded border border-inputborder" />
                    <input value={m.color || ""} onChange={(e) => updTeam(i, { ...m, color: e.target.value })} className="h-10 w-full rounded-lg border border-inputborder px-2 text-sm uppercase outline-none focus:border-primary" />
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addTeam} className="mt-1 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-sm font-semibold text-ink-secondary hover:bg-black/5">+ Adicionar pessoa</button>
      </Card>

      <Card title="Funil de etapas (colunas do Kanban)">
        <p className="-mt-2 text-xs text-ink-muted">A ordem aqui é a ordem das colunas. A <strong>última etapa</strong> é a de “no site”: arrastar um imóvel até ela publica no site (e tirar de lá volta a rascunho).</p>
        <div className="space-y-2">
          {funnel.map((s, i) => (
            <div key={s.id || i} className="rounded-lg border border-black/10 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
                <span className="text-sm font-medium text-ink">{s.label || "·"}</span>
                {i === funnel.length - 1 && <span className="rounded-full bg-[#e8f8ea] px-2 py-0.5 text-[10px] font-semibold text-[#2fa03c]">Publicado no site</span>}
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => moveFun(i, -1)} disabled={i === 0} className={arrowBtn}>▲</button>
                  <button onClick={() => moveFun(i, 1)} disabled={i === funnel.length - 1} className={arrowBtn}>▼</button>
                  <button onClick={() => delFun(i)} className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Excluir</button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Mini label="Nome da etapa" value={s.label} onChange={(v) => updFun(i, { ...s, label: v })} />
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-muted">Responsável (dono da etapa)</span>
                  <select value={s.owner || ""} onChange={(e) => updFun(i, { ...s, owner: e.target.value })} className="h-10 w-full rounded-lg border border-inputborder px-2 text-sm outline-none focus:border-primary">
                    <option value="">·</option>
                    {team.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                  </select>
                </label>
                <Mini label="Dica (opcional)" value={s.hint} onChange={(v) => updFun(i, { ...s, hint: v })} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={addFun} className="mt-1 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-sm font-semibold text-ink-secondary hover:bg-black/5">+ Adicionar etapa</button>
      </Card>
    </>
  );
}

/* ===================== CAPA / BUSCA ===================== */

function CapaTab({ data, patch }) {
  const h = data.hero;
  return (
    <Card title="Capa (topo do site)">
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
      <Card title="SEO / Metadados (Google e redes sociais)">
        <p className="-mt-2 text-xs text-ink-muted">Deixe em branco para gerar automaticamente a partir da marca.</p>
        <Field label="Título da aba/navegador (vazio = automático)" value={data.seo?.metaTitle} onChange={(v) => patch("seo", "metaTitle", v)} placeholder={`${b.name} ${b.nameHighlight}${b.tagline ? ` | ${b.tagline}` : ""}`} />
        <Field label="Nome do site ao compartilhar (vazio = automático)" value={data.seo?.siteName} onChange={(v) => patch("seo", "siteName", v)} />
        <TextArea label="Descrição (aparece no Google e ao compartilhar o link)" value={data.seo?.description} onChange={(v) => patch("seo", "description", v)} />
        <ImageField label="Imagem ao compartilhar / Open Graph (vazio = foto do “Sobre”)" value={data.seo?.ogImage} onChange={(v) => patch("seo", "ogImage", v)} />
      </Card>
      <Card title="Pixel da Meta (Facebook / Instagram)">
        <p className="-mt-2 text-xs text-ink-muted">Cole o <strong>ID do Pixel</strong> (só números) do Gerenciador de Eventos da Meta. Ele passa a rastrear as visitas do site para anúncios. Deixe em branco para desligar. Não carrega no painel /admin.</p>
        <Field label="ID do Pixel da Meta" value={data.tracking?.metaPixelId} onChange={(v) => patch("tracking", "metaPixelId", (v || "").replace(/\D/g, ""))} placeholder="Ex.: 1712094889945962" />
        <SecretField
          label="Token da API de Conversões (opcional)"
          value={data.tracking?.metaCapiToken}
          onChange={(v) => patch("tracking", "metaCapiToken", (v || "").trim())}
          placeholder="Cole aqui o token gerado na Meta"
          hint="Melhora o rastreamento enviando as conversões pelo servidor (recupera o que o navegador bloqueia). É um segredo: fica só no servidor, nunca aparece no site."
        />
      </Card>
      <Card title="Planilha de eventos (Google Sheets)">
        <p className="-mt-2 text-xs text-ink-muted">Registra cada evento (visitas, imóveis vistos, leads e cliques no WhatsApp) numa planilha do Google, ao vivo. Cole aqui o <strong>link do Web App</strong> do Google Apps Script (peça o passo a passo). Vazio = desligado.</p>
        <SecretField
          label="Link da planilha (webhook do Apps Script)"
          value={data.tracking?.sheetWebhookUrl}
          onChange={(v) => patch("tracking", "sheetWebhookUrl", (v || "").trim())}
          placeholder="https://script.google.com/macros/s/.../exec"
          hint="Fica só no servidor, nunca aparece no site. Os dados dos leads (nome, e-mail, telefone) vão em texto legível para a SUA planilha."
        />
      </Card>
      <Card title="Cores do tema">
        <p className="-mt-2 text-xs text-ink-muted">Estas cores valem para o site inteiro. Veja onde cada uma aparece:</p>
        <ColorField
          label="Cor primária (botões de ação)"
          hint="Botões de ação (Buscar, Ver imóvel, Ver todos os imóveis, Fale conosco), barra do rodapé e detalhes."
          value={c.primary}
          onChange={(v) => patch("colors", "primary", v)}
        />
        <ColorField
          label="Primária · ao passar o mouse"
          hint="Cor que os botões âmbar assumem quando o cursor passa por cima (efeito hover)."
          value={c.primaryHover}
          onChange={(v) => patch("colors", "primaryHover", v)}
        />
        <ColorField
          label="Cor de destaque (títulos e preços)"
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
        <Field label="Mensagem padrão do WhatsApp" value={c.whatsappMessage} onChange={(v) => patch("contact", "whatsappMessage", v)} placeholder="Olá, gostaria de falar sobre um imóvel." />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sigla do conselho" value={c.creciLabel} onChange={(v) => patch("contact", "creciLabel", v)} placeholder="CRECI-SP" />
          <Field label="Número do CRECI" value={c.creci} onChange={(v) => patch("contact", "creci", v)} />
        </div>
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

      <Card title="Sobre / Bio (seção da home)">
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
          A lista de <strong>cidades e bairros</strong> é montada automaticamente a partir dos imóveis cadastrados (aba Imóveis) ·
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
    <Card title="Formulário de contato (seção de cadastro)">
      <Field label="Título · linha 1" value={r.headingLine1} onChange={(v) => patch("register", "headingLine1", v)} />
      <Field label="Título · linha 2" value={r.headingLine2} onChange={(v) => patch("register", "headingLine2", v)} />
      <Field label="Título · parte destacada" value={r.headingHighlight} onChange={(v) => patch("register", "headingHighlight", v)} />
      <TextArea label="Descrição" value={r.description} onChange={(v) => patch("register", "description", v)} />
      <ImageField label="Imagem de fundo" value={r.image} onChange={(v) => patch("register", "image", v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Título do formulário" value={r.formTitle} onChange={(v) => patch("register", "formTitle", v)} />
        <Field label="Subtítulo do formulário" value={r.formSubtitle} onChange={(v) => patch("register", "formSubtitle", v)} />
      </div>
      <Field label="Texto do botão enviar" value={r.submitText} onChange={(v) => patch("register", "submitText", v)} />
      <TextArea label="Texto dos termos (checkbox)" value={r.termsText} onChange={(v) => patch("register", "termsText", v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mensagem de sucesso · título" value={r.successTitle} onChange={(v) => patch("register", "successTitle", v)} />
        <Field label="Mensagem de sucesso · texto" value={r.successText} onChange={(v) => patch("register", "successText", v)} />
      </div>
    </Card>
  );
}

/* ===================== RODAPÉ ===================== */

function RodapeTab({ data, patch }) {
  const f = data.footer;
  return (
    <>
      <Card title="Rodapé · informações">
        <TextArea label="Texto sob a marca" value={f.aboutText} onChange={(v) => patch("footer", "aboutText", v)} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Título atendimento" value={f.attendanceTitle} onChange={(v) => patch("footer", "attendanceTitle", v)} />
          <Field label="Cidade/UF" value={f.attendanceCity} onChange={(v) => patch("footer", "attendanceCity", v)} />
          <Field label="Região" value={f.attendanceRegion} onChange={(v) => patch("footer", "attendanceRegion", v)} />
        </div>
      </Card>

      <Card title="Rodapé · colunas de links">
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

function MultiImageField({ images, onChange, coverImage, showCover, onSetCover, zipName }) {
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

// Campo para segredos (token). Mascarado por padrão, com botão mostrar/ocultar.
function SecretField({ label, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-secondary">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
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
