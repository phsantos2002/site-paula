"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Aba "Mapa mental" do painel. Hospeda o módulo em JS puro (./mapa/mapaMental.js) e entrega
 * a ele o "contrato G": utilitários de interface (h, svg, icon, menus, diálogos), o banco
 * (adaptador para /api/admin/mapas) e a ligação com os imóveis do painel.
 *
 * O módulo é criado UMA vez por página e sobrevive à troca de abas: ao voltar, o mesmo
 * elemento é recolocado na tela (mesmos mapas abertos, zoom e seleção).
 */

/* ---------------- utilitários de interface (contrato G) ---------------- */
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const val = attrs[k];
    if (val == null || val === false) continue;
    if (k === "class") e.className = val;
    else if (k === "text") e.textContent = val;
    else if (k === "html") e.innerHTML = val;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), val);
    else if (k === "dataset") Object.assign(e.dataset, val);
    else if (val === true) e.setAttribute(k, "");
    else e.setAttribute(k, val);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.appendChild(typeof kid === "object" ? kid : document.createTextNode(String(kid)));
  }
  return e;
}
function svg(paths, attrs) {
  const a = attrs || {};
  const s = `<svg class="${a.cls || "ic"}" viewBox="0 0 16 16" fill="${a.fill || "none"}" stroke="${a.fill ? "none" : "currentColor"}" stroke-width="${a.sw || 1.4}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  const w = document.createElement("span"); w.innerHTML = s; return w.firstChild;
}
const ICONS = {
  list: () => svg('<path d="M2.2 4.2h1.2M2.2 8h1.2M2.2 11.8h1.2M5.8 4.2h8M5.8 8h8M5.8 11.8h8"/>'),
  dots: () => svg('<circle cx="3" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="13" cy="8" r="1.4"/>', { fill: "currentColor" }),
  plus: () => svg('<path d="M8 3.2v9.6M3.2 8h9.6"/>'),
  copy: () => svg('<rect x="5" y="5" width="8.5" height="8.5" rx="1.4"/><path d="M11 5V3.6A1.1 1.1 0 009.9 2.5H3.6A1.1 1.1 0 002.5 3.6v6.3A1.1 1.1 0 003.6 11H5"/>'),
  image: () => svg('<rect x="2" y="2.5" width="12" height="11" rx="1.6"/><circle cx="6" cy="6.2" r="1.3"/><path d="M2.4 12l3.6-3.4 2.6 2.4 2.2-1.8 2.8 2.6"/>'),
  trash: () => svg('<path d="M3 4.4h10M6.4 4.4V3h3.2v1.4M4.4 4.4l.6 8.2h6l.6-8.2"/>'),
  edit: () => svg('<path d="M11.3 2.6l2.1 2.1-7.6 7.6-2.8.7.7-2.8z"/>'),
  download: () => svg('<path d="M8 2.6v7.6M5 7.6L8 10.6l3-3M2.8 12.8h10.4"/>'),
  link: () => svg('<path d="M6.6 9.4a2.6 2.6 0 003.9.3l2-2a2.6 2.6 0 00-3.7-3.7l-1 1"/><path d="M9.4 6.6a2.6 2.6 0 00-3.9-.3l-2 2a2.6 2.6 0 003.7 3.7l1-1"/>'),
  down: () => svg('<path d="M4 6l4 4 4-4"/>'),
  up: () => svg('<path d="M4 10l4-4 4 4"/>'),
  check: () => svg('<path d="M3.5 8.5l3 3 6-7"/>'),
  title: () => svg('<path d="M3 3.5h10M8 3.5v9"/>'),
  props: () => svg('<path d="M3 4h10M3 8h10M3 12h10"/><circle cx="6" cy="4" r="1.2"/><circle cx="10" cy="8" r="1.2"/><circle cx="5" cy="12" r="1.2"/>'),
  table: () => svg('<rect x="2" y="2.5" width="12" height="11" rx="2" stroke-dasharray="2 1.6"/>'),
  send: () => svg('<path d="M2.5 8l11-5-4 11-2-4.5z"/>'),
};
const icon = (name) => (ICONS[name] || ICONS.list)();

let statusTimer = null;
function setStatus(msg) {
  let el = document.getElementById("mm-host-status");
  if (!el) { el = h("div", { class: "mm-host-status", id: "mm-host-status" }); document.body.appendChild(el); }
  el.textContent = msg; clearTimeout(statusTimer); statusTimer = setTimeout(() => el.remove(), 6000);
}

function caixaDialogo(msg, comCampo, soOk) {
  return new Promise((res) => {
    const ov = h("div", { class: "mm-host-ov" });
    const cx = h("div", { class: "mm-host-dlg" });
    cx.appendChild(h("div", { style: "white-space:pre-wrap;line-height:1.5;margin-bottom:12px" }, msg));
    let campo = null;
    if (comCampo) { campo = h("input", { type: "text", class: "mm-host-in" }); cx.appendChild(campo); }
    const fim = (v) => { ov.remove(); document.removeEventListener("keydown", tecla, true); res(v); };
    const ok = h("button", { class: "btn", type: "button", onclick: () => fim(comCampo ? campo.value : true) }, "OK");
    const bar = h("div", { style: "display:flex;gap:8px;justify-content:flex-end" });
    if (!soOk) bar.appendChild(h("button", { class: "btn ghost", type: "button", onclick: () => fim(comCampo ? null : false) }, "Cancelar"));
    bar.appendChild(ok); cx.appendChild(bar); ov.appendChild(cx);
    function tecla(e) {
      if (e.key === "Escape") { e.stopPropagation(); fim(soOk ? true : (comCampo ? null : false)); }
      else if (e.key === "Enter") { e.preventDefault(); ok.click(); }
    }
    document.addEventListener("keydown", tecla, true);
    document.body.appendChild(ov); (campo || ok).focus();
  });
}

function camada() {
  let l = document.getElementById("mm-host-layer");
  if (!l) { l = h("div", { id: "mm-host-layer" }); document.body.appendChild(l); }
  return l;
}
let closers = [];
function closePops() { closers.forEach((f) => f()); closers = []; }
function popup(anchor, build, opts) {
  closePops();
  const o = opts || {}; const r = anchor.getBoundingClientRect();
  const pop = h("div", { class: "mm-host-pop" }); camada().appendChild(pop);
  build(pop, null, close);
  const pr = pop.getBoundingClientRect();
  let left = o.align === "right" ? r.right - pr.width : r.left;
  left = Math.max(8, Math.min(left, window.innerWidth - pr.width - 8));
  let top = r.bottom + 4; if (top + pr.height > window.innerHeight - 8) top = Math.max(8, r.top - pr.height - 4);
  pop.style.left = left + "px"; pop.style.top = top + "px";
  function onDoc(e) { if (!pop.contains(e.target)) close(); }
  function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
  setTimeout(() => document.addEventListener("mousedown", onDoc, true), 0);
  document.addEventListener("keydown", onKey, true);
  function close() {
    document.removeEventListener("mousedown", onDoc, true); document.removeEventListener("keydown", onKey, true);
    pop.remove(); closers = closers.filter((f) => f !== close);
  }
  closers.push(close);
}
function menuPopup(anchor, items, align) {
  popup(anchor, (pop, _r, close) => {
    const list = h("div", { class: "mm-host-list" });
    items.forEach((it) => {
      if (it === "-") { list.appendChild(h("div", { class: "mm-host-sep" })); return; }
      list.appendChild(h("button", { class: "mm-host-item" + (it.danger ? " danger" : ""), type: "button", onclick: () => { close(); it.run(); } }, it.icon ? icon(it.icon) : null, it.label));
    });
    pop.appendChild(list);
  }, { align });
}
async function copiarTexto(txt, botao) {
  try { await navigator.clipboard.writeText(txt); }
  catch (e) {
    const ta = h("textarea", { style: "position:fixed;opacity:0" }, txt); document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (_) {} ta.remove();
  }
  if (botao) { const r = botao.textContent; botao.textContent = "Copiado"; setTimeout(() => { botao.textContent = r; }, 1400); }
}
const editingNow = () => {
  const a = document.activeElement;
  return !!(a && (a.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(a.tagName)));
};

/* ---------------- banco: adaptador para /api/admin/mapas (interface estilo Firestore) ---------------- */
const POLL_MS = 15000;
function criarBanco() {
  const ouvintes = new Set();
  let timer = null;
  let ultima = [];
  async function buscar() {
    try {
      const r = await fetch("/api/admin/mapas", { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Falha ao carregar");
      ultima = j.mapas || [];
      ouvintes.forEach((f) => f(ultima));
    } catch (e) { console.warn("mapas: falha ao carregar", e); }
  }
  function agendar() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (ouvintes.size && document.visibilityState === "visible") await buscar();
      if (ouvintes.size) agendar();
    }, POLL_MS);
  }
  return {
    doc(caminho) {
      const [col, id] = String(caminho).split("/");
      return {
        async set(d) {
          if (col !== "mapas") return;
          const r = await fetch("/api/admin/mapas", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, data: d }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) throw new Error(j.error || "Falha ao salvar");
        },
        async delete() {
          if (col !== "mapas") return;
          const r = await fetch("/api/admin/mapas?id=" + encodeURIComponent(id), { method: "DELETE" });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) throw new Error(j.error || "Falha ao excluir");
        },
        // Só usado pela semeadura de modelos (desligada): responde "já existe".
        onSnapshot(next) { setTimeout(() => next({ exists: true, data: () => ({}) }), 0); return () => {}; },
      };
    },
    collection() {
      return {
        onSnapshot(next) {
          const f = (lista) => next({ docs: lista.map((m) => ({ id: m.id, exists: true, data: () => m })) });
          ouvintes.add(f); buscar(); agendar();
          return () => { ouvintes.delete(f); if (!ouvintes.size) clearTimeout(timer); };
        },
      };
    },
    buscar,
  };
}

/* ---------------- instância única do módulo ---------------- */
let inst = null;
let carregando = null;
const ponte = { abrirImovel: null, criarImovel: null }; // callbacks atuais do React
const estado = { view: "outro", items: new Map() };
const banco = typeof window !== "undefined" ? criarBanco() : null;
const G = {
  h, svg, icon, menuPopup, caixaDialogo, copiarTexto, setStatus, editingNow,
  state: estado,
  db: () => banco,
  sessao: () => ({ nome: G.nomeSessao || "Equipe" }),
  openPeek: (id) => ponte.abrirImovel && ponte.abrirImovel(id),
  onDbErr: (e) => setStatus("Erro ao salvar: " + ((e && e.message) || e)),
  novaSolicitacao: (pre) => ponte.criarImovel && ponte.criarImovel(pre),
  podeCriar: () => !!ponte.criarImovel,
  marca: "",
  logo: null,
  semear: false,
};

function carregarModulo() {
  if (inst) return Promise.resolve(inst);
  if (!carregando) {
    carregando = import("./mapa/mapaMental").then(({ default: MapaMental }) => {
      inst = MapaMental(G);
      // Antes de fechar/recarregar a página: envia já o que estiver pendente (o módulo
      // espera 700 ms antes de salvar). keepalive deixa o envio terminar com a aba fechando.
      window.addEventListener("pagehide", () => {
        const { MM } = inst;
        [...MM.pend.keys()].forEach((id) => {
          const m = MM.mapas.get(id); if (!m) return;
          try {
            fetch("/api/admin/mapas", {
              method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, data: { ...m, atualizado: Date.now() } }),
            });
          } catch {}
        });
      });
      return inst;
    });
  }
  return carregando;
}

function rotuloImovel(p) {
  const t = p.title || (p.textoBruto || "").split("\n")[0].slice(0, 50) || "(sem título)";
  return `${p.code} · ${t}`;
}

/* ---------------- componente ---------------- */
export default function MapaMentalTab({ properties = [], brand = {}, onOpenProperty, onCreateProperty }) {
  const hostRef = useRef(null);
  const [erro, setErro] = useState(null);

  // Mantém a ponte com o React sempre atual (callbacks e lista de imóveis para vincular).
  ponte.abrirImovel = onOpenProperty || null;
  ponte.criarImovel = onCreateProperty || null;
  G.marca = [brand?.name, brand?.nameHighlight].filter(Boolean).join(" ");
  useEffect(() => {
    estado.items = new Map(properties.map((p) => [p.id, {
      id: p.id,
      nome: rotuloImovel(p),
      busca: [p.code, p.title, p.neighborhood, p.city, p.type].filter(Boolean).join(" "),
      postagem: "",
    }]));
    if (inst && inst.MM.el && estado.view === "mapa" && !editingNow() && !inst.MM.arrastando) inst.renderMapa(null, true);
  }, [properties]);

  useEffect(() => {
    let vivo = true, parar = null;
    carregarModulo().then(({ renderMapa, mmReceber, MM }) => {
      if (!vivo || !hostRef.current) return;
      estado.view = "mapa";
      renderMapa(hostRef.current);
      MM.ajustarPend = true;
      parar = banco.collection("mapas").onSnapshot((s) =>
        mmReceber(s.docs.map((d) => { const x = d.data(); return x && !x.id ? { ...x, id: d.id } : x; })));
    }).catch((e) => { console.error(e); if (vivo) setErro("Não foi possível carregar o mapa mental."); });
    return () => {
      vivo = false;
      estado.view = "outro";
      if (parar) parar();
      closePops();
      if (inst) {
        const { MM } = inst;
        if (MM.cheia) document.documentElement.classList.remove("mm-sem-rolagem");
        if (MM.el && MM.el.parentNode) MM.el.parentNode.removeChild(MM.el);
      }
    };
  }, []);

  return (
    <div className="mm-host">
      <style>{HOST_CSS}</style>
      {erro && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{erro}</div>}
      <div ref={hostRef} />
    </div>
  );
}

/* Estilos que o módulo espera da página (variáveis --mm-*, botões, menus e diálogos). */
const HOST_CSS = `
:root{
  --mm-text:#37352f; --mm-text-2:rgba(55,53,47,.65); --mm-text-3:rgba(55,53,47,.45);
  --mm-border:rgba(55,53,47,.09); --mm-border-2:rgba(55,53,47,.16);
  --mm-hover:rgba(55,53,47,.06); --mm-active:rgba(55,53,47,.08);
  --mm-shadow:0 0 0 1px rgba(15,15,15,.05),0 3px 6px rgba(15,15,15,.1),0 9px 24px rgba(15,15,15,.2);
}
.mm-host .mmw{font-size:14px;line-height:1.5;color:var(--mm-text);margin-top:0;height:calc(100vh - 120px)}
.mmw [hidden],.mmw[hidden],.mm-host-pop [hidden]{display:none!important}
svg.ic{width:16px;height:16px;flex:none;display:block}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 14px;border-radius:6px;background:#2383e2;color:#fff;font-weight:500;font-size:14px}
.btn:hover{background:#1b72ca}
.btn.ghost{background:none;color:var(--mm-text-2);border:1px solid var(--mm-border-2)}
.btn.ghost:hover{background:var(--mm-hover)}
.mm-home-lista .mm-home-vazio{padding:20px 16px}
.peek-hint{font-size:13px;color:var(--mm-text-2)}
.mmw .tool{padding:2px 6px;border-radius:4px}
.mmw .tool:hover{background:var(--mm-hover)}
#mm-host-layer{position:fixed;inset:0;z-index:95;pointer-events:none}
.mm-host-pop{position:absolute;pointer-events:auto;background:#fff;border-radius:6px;box-shadow:var(--mm-shadow);min-width:240px;max-width:340px;overflow:hidden;display:flex;flex-direction:column;max-height:min(70vh,460px);font-size:14px;color:var(--mm-text)}
.mm-host-list{overflow-y:auto;padding:4px 4px 6px}
.mm-host-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;width:100%;text-align:left;font-size:14px}
.mm-host-item:hover{background:var(--mm-hover)}
.mm-host-item.danger{color:#eb5757}
.mm-host-sep{height:1px;background:var(--mm-border);margin:4px 0}
.mm-host-ov{position:fixed;inset:0;background:rgba(15,15,15,.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px}
.mm-host-dlg{background:#fff;border-radius:10px;max-width:440px;width:100%;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.25);font-size:14px;color:#37352f}
.mm-host-in{width:100%;padding:8px 10px;border:1px solid rgba(55,53,47,.2);border-radius:6px;margin-bottom:12px;font-size:14px}
.mm-host-status{position:fixed;left:16px;bottom:16px;z-index:10060;font-size:12px;color:#fff;background:#2f2f33;padding:6px 10px;border-radius:6px}
@media (max-width:1023px){.mm-host .mmw{height:calc(100vh - 170px)}}
`;
