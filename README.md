# Paula Regina — Corretora de Imóveis

Landing page construída em **Next.js 14 (App Router) + Tailwind CSS**, reproduzindo o design system da landing page do Grupo Kaza, adaptado para a corretora **Paula Regina**.

## Stack
- Next.js 14 (App Router, JavaScript)
- Tailwind CSS 3
- Fonte Poppins via `next/font/google`

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build
npm start
```

## Estrutura

```
app/
  layout.js          # fonte Poppins + metadata
  page.js            # composição das seções
  globals.css        # tokens de design (CSS vars) + Tailwind
components/
  Header.jsx         # navbar sticky com gradiente / estado "stuck"
  Hero.jsx           # banner full-viewport + H1
  SearchBar.jsx      # barra de busca pill
  CorpRibbon.jsx     # faixa âmbar de credenciais
  ServicesCarousel.jsx
  ExploreSection.jsx
  MapSection.jsx
  CitiesSection.jsx  # links por bairro
  RegisterForm.jsx   # formulário de cadastro (com estado)
  WhatsAppFloat.jsx
  Footer.jsx
tailwind.config.js   # paleta âmbar, raios pill, sombras
```

## Painel de administração (`/admin`)

O conteúdo do site é editável por uma pessoa não-técnica, sem mexer no código.

- Acesse **http://localhost:3000/admin**
- Senha definida em `.env.local` (`ADMIN_PASSWORD`). Padrão: `paula2026` — **troque antes de publicar**.
- Abas disponíveis: **Contatos**, **Imóveis**, **Equipe & Funil**, **Capa**, **Marca & Cores** (inclui SEO), **Menu & Contato**, **Seções da Home**, **Formulário**, **Rodapé**.
- Upload de imagens (capa, foto, cards) — salvas em `public/uploads/`.
- Clique em **Salvar alterações** e atualize o site.

### Revenda / White-label (comercializar para outros corretores)
O site é um **template revendável**: um deploy por cliente, tudo configurável pelo painel — **nada de “Paula Regina” fica preso no código**.

Para colocar um novo cliente no ar:
1. **Clonar e deployar** (Vercel + Supabase — ver [DEPLOY.md](DEPLOY.md)). Defina `ADMIN_PASSWORD` própria e, se tiver domínio, `NEXT_PUBLIC_SITE_URL`.
2. No `/admin`, aba **Marca & Cores**: nome, subtítulo, **cores** e **SEO** (título, descrição, imagem de compartilhamento). Campos de SEO em branco são gerados automaticamente a partir da marca.
3. Aba **Menu & Contato**: WhatsApp, telefone, **sigla do conselho** (CRECI-SP, CRECI-RJ…), número, redes e a **mensagem padrão do WhatsApp**.
4. Aba **Equipe & Funil**: monte a equipe do cliente (nomes, cor, emoji, função) e o **funil de etapas** do Kanban (nomes, ordem, dono de cada etapa). A última etapa é sempre a de “no site”.
5. Aba **Seções da Home** / **Capa** / **Rodapé** / **Formulário**: textos, fotos e links.

O que é gerado automaticamente a partir da marca (sem tocar em código): título das abas do navegador, Open Graph/redes, nome no rodapé, tela de login e as mensagens de WhatsApp.

Como funciona:
- Todo o conteúdo vive em `data/site-content.json` (criado no primeiro salvamento; até lá usa os padrões de `lib/content.js`).
- As cores são aplicadas em tempo real via CSS variables (`components/ThemeStyle.jsx`) — não precisa rebuild.
- Rotas de API: `app/api/admin/{login,logout,save,upload}`.

### Armazenamento (arquivos ou Supabase)
O site detecta automaticamente:
- **Sem variáveis do Supabase** (PC local): salva em `data/*.json` e `public/uploads/`.
- **Com Supabase configurado** (produção/Vercel): salva no banco (tabela `singletons`) e imagens no Storage.

Para publicar grátis na **Vercel + Supabase**, siga o passo a passo em [DEPLOY.md](DEPLOY.md).

### Aba Contatos
Os envios do formulário de cadastro ficam em **/admin → Contatos** (marcar como lido, excluir, link de WhatsApp).

### Captação e ciclo de vida do imóvel (aba Imóveis)
Um imóvel existe na base **desde a captação** e só aparece no site quando é **publicado**.

A aba tem duas visões (botão **Funil ▚ / Lista ☰** no topo):
- **Funil (Kanban)** — visão padrão. Colunas = etapas de produção; arraste os cards (ou use as setas `◄ ►`) para avançar. Clique num card para editar num painel lateral.
- **Lista** — visão em linhas, com reordenação (define a ordem da capa/destaques na home) e publicar/despublicar em massa.

**Equipe (3 pessoas) e responsável:** cada imóvel tem um **Responsável agora** (chip colorido), escolhido à mão em cada card:
- 🎥 **Guilherme** — fotos & vídeo (capta, sobe fotos, edita e sobe o vídeo).
- 👩 **Paula** — corretora (passa as infos do imóvel).
- 🧑‍💻 **Pedro** — anúncios & site (coleta as infos, publica e divulga).

Dá para filtrar a aba por pessoa (chips `Responsável:` no topo) para cada um ver o que está na sua mão.

- **Etapa** (funil de produção, com dono natural por etapa):
  `1 Captação (🎥+👩) → 2 Fotos no Drive (🎥) → 3 Vídeo editado (🎥) → 4 Infos com a Paula (👩→🧑‍💻) → 5 No site (🧑‍💻)`.
  O **vídeo editado** deixou de ser item de divulgação e virou etapa de produção do Guilherme.
- **Situação** (badge no site): `Disponível` · `Exclusividade` · `Vendido` · `Alugado`.
  Deixou de ser texto no título — vira badge automático (pílula de exclusividade; faixa diagonal para vendido/alugado).
- **Publicado** (interruptor): desmarcado = **rascunho**, existe só no painel; marcado = aparece na home e na listagem.
  Todo cadastro novo **nasce como rascunho** (na mão do Guilherme). Publicar avança a etapa para "No site"; no Kanban, arrastar um card para a coluna **5 · No site** publica.
- **Material (Drive)**: campos para colar o link da **pasta de fotos** e do **vídeo** no Google Drive (botão "abrir"). O card mostra 📷/🎬 acesos quando o link existe.
- **Divulgação** (checklist de marketing do Pedro, interno): `Carrossel (Instagram)` · `Reels (Instagram)` · `Anúncio (Meta Ads)`.
  A lista mostra o progresso (`Divulg. N/3`) nos imóveis publicados.
- **Ficha de captação**: cada imóvel tem **Proprietário** (nome, contato, exclusividade) e **Captação** (data, capturado por, observações), além de condomínio, andar e mobiliado.
- **Filtros** no topo: `Todos · Rascunhos · Publicados · Divulgação pendente` + filtro por **Responsável**.

> **Migração única (rodar uma vez):** imóveis antigos trazem `VENDIDO`/`EXCLUSIVIDADE` dentro do título.
> Clique em **"Migrar títulos → Situação"** (aba Imóveis) e depois **Salvar**: o texto sai do título e vira o campo *Situação*.
> É idempotente (pode clicar de novo sem risco) e **preserva as URLs** dos imóveis.

## Design tokens
A paleta âmbar (`#F6BC41`), tipografia e espaçamentos estão centralizados em
`tailwind.config.js` e `app/globals.css` (`:root`).

## Personalização rápida
- **Telefone/WhatsApp**: `components/WhatsAppFloat.jsx` e `components/Footer.jsx`
- **CRECI / contato**: `components/Footer.jsx`
- **Imagens**: hoje apontam para o Unsplash; troque pelas fotos reais em cada componente.
- **Bairros/cidades**: `components/CitiesSection.jsx`
