/**
 * Importador de imóveis a partir do site da imobiliária parceira (fonte configurável no painel).
 * Lê só páginas públicas permitidas no robots.txt (/busca e /imovel), nunca a /api.
 *
 * 1. listarBairro(): percorre todas as páginas da busca de um bairro e lê os cards.
 * 2. ranquear(): marca as melhores oportunidades (R$/m² abaixo da mediana do mesmo tipo no bairro).
 * 3. detalhe(): abre a página do imóvel e monta a ficha (descrição, valores, fotos, características).
 *
 * O formato das páginas é o do site atual da fonte; se ele mudar, os parsers abaixo precisam de ajuste.
 */
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const CONCORRENCIA = 4;

export function origemValida(fonte) {
  try {
    const u = new URL(fonte);
    if (u.protocol !== "https:") return null;
    return u.origin;
  } catch { return null; }
}

async function baixar(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, cache: "no-store", redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return r.text();
}

async function emLotes(itens, n, fn) {
  const out = new Array(itens.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, itens.length) }, async () => {
    while (i < itens.length) { const k = i++; out[k] = await fn(itens[k], k).catch((e) => ({ erro: String(e?.message || e) })); }
  }));
  return out;
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
function decodificar(s) {
  return String(s || "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e) => {
      if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
      return ENT[e.toLowerCase()] ?? m;
    })
    .replace(/ /g, " ");
}
function linhasDeTexto(html) {
  const sem = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/gi, "");
  return decodificar(sem.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "\n"))
    .split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
}
const numBR = (s) => { const n = Number(String(s || "").replace(/[^\d,]/g, "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };

/* ---------------- payload do Next (RSC) ---------------- */
function payloadNext(html) {
  return [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
    .map((m) => { try { return JSON.parse(m[1]); } catch { return ""; } }).join("");
}
/** Extrai cada objeto JSON que começa em `marca` (ex.: '{"property":{'), respeitando chaves e strings. */
function objetosJson(texto, marca) {
  const out = [];
  let i = texto.indexOf(marca);
  while (i >= 0) {
    let prof = 0, str = false, esc = false, k = i;
    for (; k < texto.length; k++) {
      const ch = texto[k];
      if (str) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') str = false; continue; }
      if (ch === '"') str = true; else if (ch === "{") prof++; else if (ch === "}") { prof--; if (!prof) break; }
    }
    try { out.push(JSON.parse(texto.slice(i, k + 1))); } catch {}
    i = texto.indexOf(marca, k + 1);
  }
  return out;
}

/* ---------------- busca por bairro ---------------- */
function lerCards(html, origem) {
  const links = new Map();
  for (const m of html.matchAll(/href="(\/imovel\/[^"]+\/([A-Z]{2}\d+))"/g)) links.set(m[2], m[1]);
  return objetosJson(payloadNext(html), '{"property":{')
    .map((o) => o.property)
    .filter((p) => p && p.code && p.transactionType !== "rent")
    .map((p) => ({
      codigo: p.code,
      url: links.has(p.code) ? origem + links.get(p.code) : "",
      tipo: p.type || "",
      condominio: p.developmentName || "",
      bairro: p.neighborhood || "",
      cidade: p.city || "",
      rua: [p.street, p.streetNumber].filter(Boolean).join(", "),
      area: Number(p.area) || 0, quartos: Number(p.bedrooms) || 0, suites: Number(p.suites) || 0, vagas: Number(p.parking) || 0,
      preco: Number(p.price) || 0,
      condo: Number(p.condominiumFee) || 0,
      exclusivo: !!p.exclusive,
      foto: p.image || (p.images || [])[0] || "",
      atualizado: p.updatedAt || "",
      status: p.status || "",
    }))
    .filter((c) => c.url && c.tipo !== "Empreendimento" && (!c.status || c.status === "available"));
}

export async function listarBairro(fonte, bairro) {
  const origem = origemValida(fonte);
  if (!origem) throw new Error("Endereço da fonte inválido (use https://…).");
  const urlPag = (n) => `${origem}/busca?bairro=${encodeURIComponent(bairro)}${n > 1 ? `&page=${n}` : ""}`;
  const h1 = await baixar(urlPag(1));
  const total = Number((linhasDeTexto(h1).join(" ").match(/([\d.]+)\s+imóveis encontrados/) || [])[1]?.replace(/\./g, "")) || 0;
  const paginas = Math.max(1, ...[...h1.matchAll(/[?&](?:amp;)?page=(\d+)/g)].map((m) => Number(m[1])));
  const resto = await emLotes(Array.from({ length: Math.min(paginas, 40) - 1 }, (_, k) => k + 2), CONCORRENCIA, (n) => baixar(urlPag(n)));
  const vistos = new Set();
  const cards = [h1, ...resto.filter((x) => typeof x === "string")]
    .flatMap((h) => lerCards(h, origem))
    .filter((c) => (vistos.has(c.codigo) ? false : vistos.add(c.codigo)));
  // a busca da fonte pode trazer vizinhos; fica só o bairro pedido
  const alvo = semAcento(bairro);
  return { bairro, total, paginas, cards: cards.filter((c) => !c.bairro || semAcento(c.bairro) === alvo) };
}
const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/* ---------------- ranking de oportunidades ---------------- */
const mediana = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Tipos residenciais: os únicos pré-selecionados (terreno/comercial aparecem, mas desmarcados). */
export const TIPOS_RESIDENCIAIS = /casa|apartamento|cobertura|sobrado|flat|studio|kitnet/i;

/**
 * Oportunidade = R$/m² abaixo da mediana de imóveis comparáveis:
 *  1º mesmo tipo no mesmo condomínio/prédio (se houver 4 ou mais);
 *  2º senão, mesmo tipo no bairro (5 ou mais); 3º senão, o bairro todo.
 * Cards sem preço/área ficam de fora. Descontos acima de 50% costumam ser erro de cadastro
 * (área do terreno no lugar da construída etc.) e entram marcados como "conferir", sem pré-seleção.
 */
export function ranquear(cards) {
  const validos = cards.filter((c) => c.preco > 0 && c.area >= 20);
  const grupo = (chave) => { const g = new Map(); validos.forEach((c) => { const k = chave(c); if (!k) return; if (!g.has(k)) g.set(k, []); g.get(k).push(c.preco / c.area); }); return g; };
  const porCondo = grupo((c) => c.condominio && `${c.tipo}|${semAcento(c.condominio)}`);
  const porTipo = grupo((c) => c.tipo || "?");
  const geral = validos.map((c) => c.preco / c.area);
  return validos
    .map((c) => {
      const lc = c.condominio ? porCondo.get(`${c.tipo}|${semAcento(c.condominio)}`) || [] : [];
      const lt = porTipo.get(c.tipo || "?") || [];
      const [lista, base] = lc.length >= 4 ? [lc, "condominio"] : lt.length >= 5 ? [lt, "tipo"] : [geral, "bairro"];
      const ref = mediana(lista);
      const m2 = c.preco / c.area;
      const desconto = ref ? 1 - m2 / ref : 0;
      return { ...c, m2: Math.round(m2), m2Ref: Math.round(ref), base, comparaveis: lista.length,
        desconto: Math.round(desconto * 1000) / 1000, conferir: desconto > 0.5, residencial: TIPOS_RESIDENCIAIS.test(c.tipo) };
    })
    .sort((a, b) => (a.conferir - b.conferir) || (b.desconto - a.desconto));
}

/* ---------------- página do imóvel ---------------- */
function jsonLd(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); (j["@graph"] || [j]).forEach((x) => out.push(x)); } catch {}
  }
  return out;
}
function listaDoPayload(payload, titulo) {
  // Seções "Características do imóvel" / "Infraestrutura do condomínio" vêm como <li> no payload do Next.
  const i = payload.indexOf(titulo);
  if (i < 0) return [];
  const fim = payload.indexOf('"title":[', i + 20);
  const trecho = payload.slice(i, fim > 0 ? fim : i + 20000);
  return [...trecho.matchAll(/\["\$","li","([^"]{1,80})",/g)].map((m) => m[1]);
}
const ITENS_IGNORAR = /^(exibir site|plano|aceita permuta|sobrado casa)$/i;

const TEL = /\(?\b\d{2}\)?\s*9?\d{4}[-\s]?\d{4}\b/;
const RODAPE = /\b(contato\s*:|vendas\s*:|baixe nosso aplicativo|creci\s*:?\s*\d|agende (sua|uma) visita|whats ?app)/i;

/** Tira da descrição o que é da imobiliária de origem (nome, telefones, CRECI, rodapé padrão). */
export function limparDescricao(txt, nomeFonte) {
  const re = nomeFonte ? new RegExp(nomeFonte, "i") : null;
  let t = String(txt || "").replace(/\r/g, "");
  // Rodapé padrão colado no fim ("Contato: (12)… Vendas: Imobiliária… Baixe nosso aplicativo…")
  const corte = t.search(/\b(contato\s*:|vendas\s*:\s*imobili|baixe nosso aplicativo)/i);
  if (corte > 40) t = t.slice(0, corte);
  return t
    .split(/\n{2,}/)
    .map((par) => par
      .split(/(?<=[.!?])\s+|\n/)
      .filter((f) => !(re && re.test(f)) && !TEL.test(f) && !RODAPE.test(f))
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;!?])/g, "$1")
      .replace(/[\s,;:–-]+$/, "")
      .trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Textos longos do Next vêm como referência "$1c" para uma linha "1c:T<tamanho-hex>,<texto>". */
function resolverTexto(payload, v) {
  if (typeof v !== "string" || !/^\$[0-9a-z]+$/i.test(v)) return v || "";
  const id = v.slice(1);
  const m = payload.match(new RegExp("(?:^|\\n)" + id + ":T([0-9a-f]+),"));
  if (!m) return "";
  const ini = m.index + m[0].length;
  const bytes = parseInt(m[1], 16);
  return Buffer.from(payload.slice(ini, ini + bytes * 2), "utf8").subarray(0, bytes).toString("utf8");
}

export async function detalhe(fonte, url) {
  const origem = origemValida(fonte);
  if (!origem || !String(url).startsWith(origem + "/imovel/")) throw new Error("URL fora da fonte configurada.");
  const html = await baixar(url);
  const ld = jsonLd(html);
  const org = ld.find((x) => x["@type"] === "Organization");
  const res = ld.find((x) => x.offers && x.address) || {};
  const payload = payloadNext(html);
  const cab = (() => { const i = payload.indexOf('"listingHref":'); if (i < 0) return {}; const ini = payload.lastIndexOf('{"price"', i); try { const fim = payload.indexOf(',"broker"', i); return JSON.parse(payload.slice(ini, fim) + "}"); } catch { return {}; } })();
  const corretor = (payload.match(/"broker":\{"slug":"[^"]*","name":"([^"]+)"/) || [])[1] || "";
  const exclusivo = /"exclusive":true/.test(payload);

  const L = linhasDeTexto(html);
  const num = (rotulo) => { const i = L.findIndex((l, k) => k > 5 && new RegExp("^" + rotulo + "$", "i").test(l)); return i > 0 ? numBR(L[i - 1]) : 0; };
  const valor = (rotulo) => { const i = L.findIndex((l) => new RegExp("^" + rotulo + "$", "i").test(l)); return i >= 0 && /R\$/.test(L[i + 1] || "") ? numBR(L[i + 1]) : 0; };
  const iDesc = L.findIndex((l) => l === "Descrição");
  const titulo = iDesc >= 0 && L[iDesc + 1] === "do imóvel" ? L[iDesc + 2] : "";
  const iTit = L.findIndex((l) => l === (res.name || "__"));
  const condominio = iTit >= 0 && L[iTit + 1] && !/^Rua|^Av|^Alameda|^Estrada/i.test(L[iTit + 1]) && L[iTit + 1] !== "Cod" ? L[iTit + 1] : "";

  // Descrição completa (o JSON-LD corta o texto): vem do bloco whitespace-pre-line no payload.
  const descPayload = (() => {
    const m = payload.match(/"className":"whitespace-pre-line[^"]*","children":("(?:[^"\\]|\\.)*")/);
    if (!m) return "";
    try { return resolverTexto(payload, JSON.parse(m[1])); } catch { return ""; }
  })();
  const nomeFonte = (org?.name || "").split(/\s+/)[0]; // ex.: "Riccio"

  const nome = res.name || "";
  const fotos = [];
  for (const m of html.matchAll(/<img[^>]*>/g)) {
    const alt = decodificar((m[0].match(/alt="([^"]*)"/) || [])[1] || "");
    const src = decodificar((m[0].match(/src="([^"]*)"/) || [])[1] || "");
    if (nome && alt.startsWith(nome + " —") && /^https:\/\//.test(src) && !fotos.includes(src)) fotos.push(src);
  }

  return {
    url, codigo: cab.code || url.split("/").pop(),
    nome, titulo, condominio,
    bairro: res.address?.addressNeighborhood || cab.neighborhood || "",
    cidade: res.address?.addressLocality || cab.city || "",
    estado: res.address?.addressRegion || "SP",
    preco: Number(cab.price) || Number(res.offers?.price) || valor("Venda"),
    condo: Number(cab.condominiumFee) || valor("Condomínio"),
    iptu: Number(cab.iptu) || valor("IPTU"),
    area: Number(cab.area) || Number(res.floorSize?.value) || 0,
    quartos: Number(cab.bedrooms) || Number(res.numberOfBedrooms) || num("dorms?"),
    suites: num("suítes?"), vagas: num("vagas?"),
    banheiros: Number(res.numberOfBathroomsTotal) || 0,
    descricao: limparDescricao(descPayload || res.description, nomeFonte),
    caracteristicas: listaDoPayload(payload, '"children":"Características"').filter((x) => !ITENS_IGNORAR.test(x)),
    infraCondominio: listaDoPayload(payload, '"title":["Infraestrutura do"'),
    fotos, corretor, exclusivo, fonteNome: org?.name || "",
  };
}
