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
- Abas disponíveis: **Capa/Hero**, **Marca & Cores**, **Contato & Redes**, **Textos & Seções** (faixa, sobre, serviços, cidades/bairros).
- Upload de imagens (capa, foto, cards) — salvas em `public/uploads/`.
- Clique em **Salvar alterações** e atualize o site.

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

- **Situação** (badge no site): `Disponível` · `Exclusividade` · `Vendido` · `Alugado`.
  Deixou de ser texto no título — vira badge automático (pílula de exclusividade; faixa diagonal para vendido/alugado).
- **Etapa** (funil interno, não aparece no site): `1 Captado → 2 Fotos tratadas → 3 Cadastrado → 4 Publicado`.
- **Publicado** (interruptor): desmarcado = **rascunho**, existe só no painel; marcado = aparece na home e na listagem.
  Todo cadastro novo **nasce como rascunho**. O botão **Publicar** (na lista) já avança a etapa para "Publicado".
- **Ficha de captação**: cada imóvel tem **Proprietário** (nome, contato, exclusividade) e **Captação** (data, capturado por, observações), além de condomínio, andar e mobiliado.
- **Filtro** no topo da lista: `Todos · Rascunhos · Publicados · por etapa`.

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
