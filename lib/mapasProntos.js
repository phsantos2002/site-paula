/**
 * Mapas mentais prontos (genéricos, sem nome de cliente — o projeto é white-label).
 * Usado em dois lugares:
 *  - como modelo na galeria do Mapa mental (components/admin/mapa/mapaMental.js);
 *  - pelo servidor (lib/mapas.js), que cria cada um UMA vez na base do cliente.
 */
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

const EST = {
  raiz: { forma: "arredondado", fill: "#F1EFE8", borda: "#8A8880", cor: "#444441", tam: 20 },
  esq: { forma: "arredondado", fill: "#EEEDFE", borda: "#7F77DD", cor: "#3C3489" },
  dir: { forma: "arredondado", fill: "#E1F5EE", borda: "#3E8A6E", cor: "#1D4D3B" },
};

const no = (t, est, lado) => ({ id: uid(), t, filhos: [], est: { ...est }, ...(lado ? { lado } : {}) });

/** Imobiliária · Visão do CEO: 10 áreas da empresa em volta do tópico central. */
export function raizVisaoCeo() {
  const d = [
    ["Captação", "Estoque de imóveis"],
    ["Marketing", "Portais, redes, leads"],
    ["Comercial", "Funil, visitas, propostas"],
    ["Pós-venda", "Docs, crédito, cartório"],
    ["Expansão", "Escala, novos nichos"],
  ];
  // o layout desenha o lado esquerdo de baixo para cima: lista em ordem inversa
  const e = [
    ["Tecnologia e dados", "CRM, KPIs, automação"],
    ["Financeiro", "Caixa, DRE, honorários"],
    ["Pessoas", "Time, comissão, treino"],
    ["Jurídico", "CRECI, contratos, LGPD"],
    ["Estratégia", "Nicho, região, metas"],
  ];
  const r = no("Imobiliária\nVisão do CEO", EST.raiz);
  r.filhos = [
    ...d.map(([t, s]) => no(t + "\n" + s, EST.dir, "d")),
    ...e.map(([t, s]) => no(t + "\n" + s, EST.esq, "e")),
  ];
  return r;
}

/** Ajustes do mapa (além da raiz) para ficar com o visual do modelo. */
export const EXTRA_VISAO_CEO = { layout: "mapa", tema: "limpo", ramo: "curva", corLinha: "#CFCFCF" };

/** Mapas criados automaticamente uma vez em cada base nova. */
export function mapasIniciais() {
  const agora = Date.now();
  return [
    {
      id: "mapa-visao-ceo", nome: "Imobiliária · Visão do CEO", raiz: raizVisaoCeo(),
      flut: [], rel: [], res: [], lim: [], fundo: null, espaco: 1, ...EXTRA_VISAO_CEO,
      criado: agora, atualizado: agora, por: "Modelo",
    },
  ];
}
