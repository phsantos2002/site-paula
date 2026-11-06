"use client";

import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/format";
import { Field, NumberField } from "./fields";

/**
 * Importar imóveis de um site parceiro (ex.: a imobiliária onde o corretor trabalha).
 * 1) varre os bairros escolhidos e ranqueia as oportunidades (R$/m² abaixo dos comparáveis);
 * 2) a equipe confere e marca o que entra;
 * 3) importa a ficha completa (fotos, descrição, valores, características) e, se pedido,
 *    substitui todos os imóveis atuais.
 */

const ROTULO_TIPO = (t) => String(t || "").replace(/^Casa em Condom[ií]nio$/i, "Casa em condomínio").replace(/^Galpao$/i, "Galpão").replace(/^Predio Comercial$/i, "Prédio comercial");

function tipoInterno(t) {
  const s = String(t || "").toLowerCase();
  if (/apart|cobertura|flat|studio|kitnet|loft/.test(s)) return "Apartamento";
  if (/casa|sobrado/.test(s)) return "Casa";
  if (/terreno|lote|ch[aá]cara|[aá]rea/.test(s)) return "Terreno";
  return "Comercial";
}

// Nomes de condomínio/prédio vêm sem acento na fonte ("Condominio", "Edificio").
const acentuar = (n) => String(n || "").replace(/\bCondominio\b/g, "Condomínio").replace(/\bEdificio\b/g, "Edifício").replace(/\s{2,}/g, " ").trim();

const pct = (d) => `${Math.round((d || 0) * 100)}%`;
const BASE_TXT = { condominio: "do mesmo condomínio/prédio", tipo: "do mesmo tipo no bairro", bairro: "do bairro" };

/** Monta o imóvel do nosso sistema a partir do card ranqueado + ficha completa. */
function montarImovel({ card, ficha, code, idx, publicar, etapaPub, etapaRasc, vitrine }) {
  const f = ficha || {};
  const tipoF = card.tipo || "";
  const bairro = f.bairro || card.bairro || "";
  const cidade = f.cidade || card.cidade || "";
  const condominio = acentuar(f.condominio || card.condominio || "");
  const quartos = f.quartos || card.quartos || 0;
  const qTxt = quartos ? ` - ${quartos} ${quartos === 1 ? "quarto" : "quartos"}` : "";
  // Ex.: "Casa em condomínio à venda no Condomínio Alphaville 2, Urbanova - 3 quartos"
  const titulo = condominio
    ? `${ROTULO_TIPO(tipoF) || tipoInterno(tipoF)} à venda no ${condominio}${condominio.toLowerCase().includes(bairro.toLowerCase()) ? "" : `, ${bairro}`}${qTxt}`
    : `${ROTULO_TIPO(tipoF) || tipoInterno(tipoF)} à venda em ${cidade} no bairro ${bairro}${qTxt}`;
  const obs = [
    `Importado de ${f.fonteNome || "site parceiro"} · Cód ${card.codigo}`,
    `R$/m² ${pct(card.desconto)} abaixo da mediana ${BASE_TXT[card.base] || ""} (${card.comparaveis} comparáveis; R$ ${card.m2?.toLocaleString("pt-BR")} vs R$ ${card.m2Ref?.toLocaleString("pt-BR")}/m²)`,
    f.corretor ? `Corretor na fonte: ${f.corretor}` : "",
    (f.exclusivo ?? card.exclusivo) ? "Exclusividade da imobiliária parceira" : "",
  ].filter(Boolean).join("\n");
  return {
    id: `${code}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    code,
    title: titulo,
    type: tipoInterno(tipoF),
    operation: ["Venda"],
    city: cidade, neighborhood: bairro, state: f.estado || "SP",
    price: f.preco || card.preco || 0, rentPrice: 0,
    condo: f.condo || card.condo || 0, iptu: f.iptu || 0,
    area: f.area || card.area || 0,
    bedrooms: quartos, suites: f.suites || card.suites || 0, bathrooms: f.banheiros || 0, parking: f.vagas || card.vagas || 0,
    description: f.descricao || "",
    textoBruto: "",
    features: f.caracteristicas || [],
    condoFeatures: f.infraCondominio || [],
    images: (f.fotos && f.fotos.length ? f.fotos : [card.foto].filter(Boolean)).slice(0, 40),
    featured: vitrine && idx < 8, cover: vitrine && idx < 4, coverImage: "",
    coverOrder: idx, featuredOrder: idx,
    status: "disponivel", etapa: publicar ? etapaPub : etapaRasc, publicado: !!publicar, responsavel: "",
    condominio, andar: 0, mobiliado: false,
    proprietario: { nome: "", contato: "", exclusividade: false },
    captacao: { data: new Date().toISOString().slice(0, 10), capturadoPor: "", observacoes: obs },
    driveLinks: { fotos: "", video: "" },
    distribuicao: { carrossel: false, reels: false, anuncio: false },
    origem: { fonte: f.fonteNome || "", codigo: card.codigo, url: card.url, importadoEm: Date.now() },
  };
}

async function api(body) {
  const r = await fetch("/api/admin/importar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.error || `Erro ${r.status}`);
  return j;
}

export default function ImportarImoveis({ properties, setProperties, config, onConfig, funnel, nextCode, onClose }) {
  const [fonte, setFonte] = useState(config?.fonte || "");
  const [bairrosTxt, setBairrosTxt] = useState((config?.bairros || []).join(", "));
  const [porBairro, setPorBairro] = useState(config?.porBairro || 10);
  const [fase, setFase] = useState("config"); // config | buscando | escolher | importando | pronto
  const [grupos, setGrupos] = useState([]); // [{bairro,total,lidos,candidatos,erro}]
  const [sel, setSel] = useState(() => new Set());
  const [soResid, setSoResid] = useState(true);
  const [substituir, setSubstituir] = useState(true);
  const [publicar, setPublicar] = useState(true);
  const [progresso, setProgresso] = useState({ feito: 0, total: 0, erros: [] });
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  const bairros = bairrosTxt.split(/[,;\n]/).map((b) => b.trim()).filter(Boolean);
  const etapaPub = funnel[funnel.length - 1]?.id || "no_site";
  const etapaRasc = funnel[0]?.id || "captado";
  const jaImportados = useMemo(() => new Set(properties.map((p) => p.origem?.codigo).filter(Boolean)), [properties]);

  async function buscar() {
    setErro("");
    if (!/^https:\/\//.test(fonte.trim())) { setErro("Informe o endereço do site, começando com https://"); return; }
    if (!bairros.length) { setErro("Informe pelo menos um bairro."); return; }
    onConfig({ fonte: fonte.trim(), bairros, porBairro: Number(porBairro) || 10 });
    setFase("buscando");
    const out = [];
    const marcados = new Set();
    for (const bairro of bairros) {
      try {
        const j = await api({ acao: "candidatos", fonte: fonte.trim(), bairro });
        out.push({ bairro, total: j.total, lidos: j.lidos, candidatos: j.candidatos });
        j.candidatos.filter((c) => c.residencial && !c.conferir).slice(0, Number(porBairro) || 10).forEach((c) => marcados.add(c.codigo));
      } catch (e) {
        out.push({ bairro, erro: e.message, candidatos: [] });
      }
      setGrupos([...out]);
    }
    setSel(marcados);
    setFase("escolher");
  }

  function alternar(cod) { setSel((s) => { const n = new Set(s); n.has(cod) ? n.delete(cod) : n.add(cod); return n; }); }

  const escolhidos = grupos.flatMap((g) => g.candidatos).filter((c) => sel.has(c.codigo));

  async function importar() {
    if (!escolhidos.length) return;
    if (substituir && properties.length && !confirm(`Isso vai EXCLUIR os ${properties.length} imóveis atuais do painel e do site e colocar ${escolhidos.length} novos. Continuar?`)) return;
    setFase("importando");
    const ordem = [...escolhidos].sort((a, b) => b.desconto - a.desconto);
    const fichas = new Array(ordem.length);
    const erros = [];
    let feito = 0, i = 0;
    setProgresso({ feito: 0, total: ordem.length, erros: [] });
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (i < ordem.length) {
        const k = i++;
        try { fichas[k] = (await api({ acao: "detalhe", fonte: fonte.trim(), url: ordem[k].url })).imovel; }
        catch (e) { erros.push(`${ordem[k].codigo}: ${e.message}`); }
        feito++; setProgresso({ feito, total: ordem.length, erros: [...erros] });
      }
    }));
    // Imóveis sem ficha (erro de leitura) ficam de fora: não entra nada pela metade.
    const base = substituir ? [] : properties;
    let codNum = Number(nextCode(properties)) || 1001;
    const novos = [];
    ordem.forEach((card, k) => {
      if (!fichas[k]) return;
      if (!substituir && jaImportados.has(card.codigo)) return;
      novos.push(montarImovel({ card, ficha: fichas[k], code: String(codNum++), idx: novos.length, publicar, etapaPub, etapaRasc, vitrine: substituir && publicar }));
    });
    setProperties([...novos, ...base]);
    setResultado({ novos: novos.length, excluidos: substituir ? properties.length : 0, erros });
    setFase("pronto");
  }

  const box = "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4";
  return (
    <div className={box} onClick={fase === "importando" ? undefined : onClose}>
      <div className="my-auto flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5">
          <h3 className="text-base font-semibold text-ink">Importar imóveis de outro site</h3>
          {fase !== "importando" && <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-ink-secondary hover:bg-black/5">✕</button>}
        </div>
        <p className="px-5 pb-1 pt-1 text-xs text-ink-muted">
          Varre todos os imóveis à venda dos bairros e ordena pelas melhores oportunidades: R$/m² mais abaixo da mediana de imóveis comparáveis (mesmo condomínio/prédio ou mesmo tipo no bairro).
        </p>

        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-5 py-3">
          {(fase === "config" || fase === "buscando") && (
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px]">
              <Field label="Site de onde puxar" value={fonte} onChange={setFonte} placeholder="https://www.imobiliaria.com.br" />
              <Field label="Bairros (separados por vírgula)" value={bairrosTxt} onChange={setBairrosTxt} placeholder="Urbanova, Vila Ema" />
              <NumberField label="Por bairro" value={porBairro} onChange={setPorBairro} />
            </div>
          )}
          {fase === "buscando" && <p className="text-sm text-ink-secondary">Lendo os bairros… {grupos.length}/{bairros.length}</p>}

          {fase === "escolher" && (
            <>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={soResid} onChange={(e) => setSoResid(e.target.checked)} /> Só casas e apartamentos</label>
                <span className="text-ink-muted">{escolhidos.length} selecionados</span>
                <button onClick={() => setFase("config")} className="text-sm font-medium text-ink-secondary underline">Mudar bairros</button>
              </div>
              {grupos.map((g) => {
                const lista = g.candidatos.filter((c) => !soResid || c.residencial);
                return (
                  <div key={g.bairro}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <h4 className="text-sm font-semibold text-ink">{g.bairro}</h4>
                      <span className="text-xs text-ink-muted">{g.erro ? <span className="text-red-600">{g.erro}</span> : `${g.lidos} imóveis à venda lidos · ${g.candidatos.filter((c) => sel.has(c.codigo)).length} marcados`}</span>
                    </div>
                    <div className="max-h-[42vh] overflow-y-auto rounded-xl border border-black/10">
                      {lista.slice(0, 60).map((c) => (
                        <label key={c.codigo} className={`flex cursor-pointer items-center gap-3 border-b border-black/5 px-3 py-2 text-sm last:border-0 hover:bg-black/[0.02] ${sel.has(c.codigo) ? "bg-primary/5" : ""}`}>
                          <input type="checkbox" checked={sel.has(c.codigo)} onChange={() => alternar(c.codigo)} />
                          {c.foto ? <img src={c.foto} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" loading="lazy" /> : <span className="h-12 w-16 shrink-0 rounded-md bg-black/5" />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-ink">{ROTULO_TIPO(c.tipo)}{c.condominio ? ` · ${acentuar(c.condominio)}` : ""}</span>
                            <span className="block truncate text-xs text-ink-muted">
                              {c.area} m²{c.quartos ? ` · ${c.quartos} quartos` : ""}{c.suites ? ` · ${c.suites} suítes` : ""}{c.vagas ? ` · ${c.vagas} vagas` : ""} · {c.codigo}{c.exclusivo ? " · exclusivo" : ""}
                              {jaImportados.has(c.codigo) ? " · já no painel" : ""}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-semibold text-ink">{formatBRL(c.preco)}</span>
                            <span className="block text-xs text-ink-muted">R$ {c.m2.toLocaleString("pt-BR")}/m²</span>
                          </span>
                          <span className={`w-24 shrink-0 text-right text-xs font-semibold ${c.conferir ? "text-amber-600" : c.desconto > 0 ? "text-emerald-700" : "text-ink-muted"}`} title={`Mediana ${BASE_TXT[c.base]}: R$ ${c.m2Ref.toLocaleString("pt-BR")}/m² (${c.comparaveis} imóveis)`}>
                            {c.desconto > 0 ? `${pct(c.desconto)} abaixo` : `${pct(-c.desconto)} acima`}
                            {c.conferir && <span className="block font-normal">conferir dados</span>}
                          </span>
                          <a href={c.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-xs text-ink-secondary underline">ver</a>
                        </label>
                      ))}
                      {!lista.length && <p className="p-4 text-sm text-ink-muted">Nenhum imóvel encontrado.</p>}
                    </div>
                  </div>
                );
              })}
              <div className="space-y-2 rounded-xl bg-black/[0.03] p-3 text-sm">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={substituir} onChange={(e) => setSubstituir(e.target.checked)} />
                  <span><b>Substituir todos os imóveis atuais</b> ({properties.length} serão excluídos do painel e do site). A capa e os destaques do site passam a ser os melhores importados.</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} />
                  <span><b>Publicar direto no site</b> (desmarcado: entram como rascunho no funil para revisar antes).</span>
                </label>
              </div>
            </>
          )}

          {fase === "importando" && (
            <div className="py-6 text-center">
              <p className="text-sm text-ink">Importando fichas, fotos e textos… {progresso.feito}/{progresso.total}</p>
              <div className="mx-auto mt-3 h-2 w-64 overflow-hidden rounded-full bg-black/10"><div className="h-full bg-primary transition-all" style={{ width: `${progresso.total ? (progresso.feito / progresso.total) * 100 : 0}%` }} /></div>
            </div>
          )}

          {fase === "pronto" && resultado && (
            <div className="space-y-2 py-4 text-sm">
              <p className="text-base font-semibold text-ink">✓ {resultado.novos} imóveis importados{resultado.excluidos ? `, ${resultado.excluidos} antigos excluídos` : ""}.</p>
              <p className="text-ink-secondary">O painel salva sozinho em instantes. Cada imóvel guarda nas observações da captação o código e o link de origem.</p>
              {!!resultado.erros.length && <p className="text-amber-700">Não foi possível ler {resultado.erros.length}: {resultado.erros.join(" · ")}</p>}
            </div>
          )}
          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/10 px-5 py-4">
          {fase === "config" && <>
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-black/5">Cancelar</button>
            <button onClick={buscar} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-ink-cta hover:bg-primary-hover">Buscar oportunidades</button>
          </>}
          {fase === "escolher" && <>
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-black/5">Cancelar</button>
            <button onClick={importar} disabled={!escolhidos.length} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-ink-cta hover:bg-primary-hover disabled:opacity-50">
              {substituir ? `Substituir por ${escolhidos.length} imóveis` : `Importar ${escolhidos.length} imóveis`}
            </button>
          </>}
          {fase === "pronto" && <button onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-ink-cta hover:bg-primary-hover">Concluir</button>}
        </div>
      </div>
    </div>
  );
}
