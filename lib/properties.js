import { readJson, writeJson } from "./store";

export const PROPERTY_TYPES = ["Apartamento", "Casa", "Terreno", "Comercial"];
export const OPERATIONS = ["Venda", "Aluguel", "Financiamento"];

export const DEFAULT_PROPERTIES = [
  {
    id: "1",
    code: "1001",
    title: "Casa à venda em São José dos Campos no bairro Urbanova - 4 quartos",
    type: "Casa",
    operation: ["Venda", "Financiamento"],
    city: "São José dos Campos",
    neighborhood: "Urbanova",
    state: "SP",
    price: 1250000,
    rentPrice: 0,
    condo: 650,
    iptu: 400,
    area: 240,
    bedrooms: 4,
    suites: 2,
    bathrooms: 4,
    parking: 4,
    description:
      "Casa em condomínio fechado na Urbanova, com acabamento de alto padrão, amplo living integrado, área gourmet e piscina. Fácil acesso às principais vias da cidade.",
    features: ["Área de Serviço", "Armário Cozinha", "Cozinha", "Garagem Coberta", "Lavabo", "Piscina"],
    condoFeatures: ["Área de Lazer", "Portaria 24h", "Segurança"],
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
    cover: true,
    coverImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80",
  },
  {
    id: "2",
    code: "1002",
    title: "Apartamento à venda em São José dos Campos no bairro Jardim Aquarius - 3 quartos",
    type: "Apartamento",
    operation: ["Venda", "Financiamento"],
    city: "São José dos Campos",
    neighborhood: "Jardim Aquarius",
    state: "SP",
    price: 850000,
    rentPrice: 0,
    condo: 720,
    iptu: 270,
    area: 98,
    bedrooms: 3,
    suites: 1,
    bathrooms: 2,
    parking: 2,
    description:
      "Apartamento amplo e arejado no Jardim Aquarius, próximo ao Parque da Cidade, comércio e escolas. Pronto para morar.",
    features: ["Cozinha", "Área de Serviço", "Armário Dormitório", "Sacada"],
    condoFeatures: ["Piscina", "Academia", "Salão de Festas", "Portaria 24h"],
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
    cover: true,
    coverImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2000&q=80",
  },
  {
    id: "3",
    code: "1003",
    title: "Apartamento para alugar em São José dos Campos no bairro Vila Adyana - 2 quartos",
    type: "Apartamento",
    operation: ["Aluguel"],
    city: "São José dos Campos",
    neighborhood: "Vila Adyana",
    state: "SP",
    price: 0,
    rentPrice: 3500,
    condo: 480,
    iptu: 120,
    area: 65,
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parking: 1,
    description:
      "Apartamento na Vila Adyana, região central e valorizada, perto de restaurantes e serviços. Excelente para locação.",
    features: ["Cozinha", "Área de Serviço", "Armário Cozinha"],
    condoFeatures: ["Portaria", "Elevador"],
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    id: "4",
    code: "1004",
    title: "Cobertura à venda em São José dos Campos no bairro Jardim Esplanada - 4 quartos",
    type: "Apartamento",
    operation: ["Venda", "Financiamento"],
    city: "São José dos Campos",
    neighborhood: "Jardim Esplanada",
    state: "SP",
    price: 1980000,
    rentPrice: 0,
    condo: 1500,
    iptu: 600,
    area: 210,
    bedrooms: 4,
    suites: 3,
    bathrooms: 5,
    parking: 3,
    description:
      "Cobertura duplex no Jardim Esplanada com vista panorâmica, terraço gourmet e ampla suíte master. Alto padrão no coração da cidade.",
    features: ["Área Gourmet", "Terraço", "Armário Dormitório", "Cozinha", "Lavabo"],
    condoFeatures: ["Piscina", "Academia", "Portaria 24h", "Salão de Festas"],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: false,
  },
  {
    id: "5",
    code: "1005",
    title: "Casa à venda em Jacareí no bairro Villa Branca - 3 quartos",
    type: "Casa",
    operation: ["Venda", "Financiamento"],
    city: "Jacareí",
    neighborhood: "Villa Branca",
    state: "SP",
    price: 690000,
    rentPrice: 0,
    condo: 0,
    iptu: 180,
    area: 160,
    bedrooms: 3,
    suites: 1,
    bathrooms: 2,
    parking: 2,
    description:
      "Casa térrea na Villa Branca, bairro residencial tranquilo em Jacareí, com quintal e garagem para dois carros.",
    features: ["Cozinha", "Área de Serviço", "Quintal", "Garagem Coberta"],
    condoFeatures: [],
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: false,
  },
  {
    id: "6",
    code: "1006",
    title: "Comercial para alugar ou à venda em São José dos Campos no bairro Centro",
    type: "Comercial",
    operation: ["Aluguel", "Venda"],
    city: "São José dos Campos",
    neighborhood: "Centro",
    state: "SP",
    price: 1600000,
    rentPrice: 6300,
    condo: 0,
    iptu: 100,
    area: 320,
    bedrooms: 0,
    suites: 0,
    bathrooms: 2,
    parking: 4,
    description:
      "Imóvel comercial no Centro de São José dos Campos, ótima localização para loja, clínica ou escritório. Disponível para venda ou locação.",
    features: ["Recepção", "Copa", "Estacionamento", "Acessibilidade"],
    condoFeatures: [],
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: false,
  },
];

export function slugify(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function normalize(list) {
  return (Array.isArray(list) ? list : []).map((p, i) => {
    const id = p.id || String(i + 1);
    const base = slugify(p.title || `imovel-${id}`);
    return {
      id,
      code: p.code || id,
      title: p.title || "",
      type: p.type || "Apartamento",
      operation: Array.isArray(p.operation) ? p.operation : [],
      city: p.city || "",
      neighborhood: p.neighborhood || "",
      state: p.state || "SP",
      price: Number(p.price) || 0,
      rentPrice: Number(p.rentPrice) || 0,
      condo: Number(p.condo) || 0,
      iptu: Number(p.iptu) || 0,
      area: Number(p.area) || 0,
      bedrooms: Number(p.bedrooms) || 0,
      suites: Number(p.suites) || 0,
      bathrooms: Number(p.bathrooms) || 0,
      parking: Number(p.parking) || 0,
      description: p.description || "",
      features: Array.isArray(p.features) ? p.features : [],
      condoFeatures: Array.isArray(p.condoFeatures) ? p.condoFeatures : [],
      images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
      featured: !!p.featured,
      cover: !!p.cover,
      coverImage: p.coverImage || "",
      slug: `${base}-${p.code || id}`,
    };
  });
}

export async function getProperties() {
  const raw = await readJson("properties", null);
  return normalize(Array.isArray(raw) ? raw : DEFAULT_PROPERTIES);
}

export async function getProperty(slug) {
  const list = await getProperties();
  return list.find((p) => p.slug === slug || p.id === slug || p.code === slug);
}

export async function saveProperties(list) {
  const normalized = normalize(list);
  await writeJson("properties", normalized);
  return normalized;
}
