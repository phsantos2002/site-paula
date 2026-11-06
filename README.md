# Site de corretor de imóveis (template white-label)

Site + painel de administração para corretores de imóveis. A primeira instância é a da **Paula Regina** (São José dos Campos), mas o projeto é um **template revendável**: um deploy por cliente (Vercel + Supabase), com marca, equipe, funil e conteúdo editáveis pelo painel. Nenhum nome de cliente fica no código.

## Stack
- Next.js 14 (App Router, JavaScript) + Tailwind CSS 3
- Supabase (banco + Storage) em produção; arquivos locais em desenvolvimento
- Meta Pixel + API de Conversões (CAPI), planilha Google via webhook

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000  ·  painel em /admin
```

Produção: `npm run build && npm start`. Para publicar, siga o [DEPLOY.md](DEPLOY.md).

## Estrutura

```
app/
  page.js                  # home (capa, sobre, destaques, bairros, formulário)
  imoveis/page.js          # listagem com busca e filtros
  imovel/[slug]/page.js    # página do imóvel
  admin/page.js            # painel (login + AdminForm)
  api/leads                # formulário do site (público) -> contato + Lead na CAPI
  api/meta/capi            # eventos do navegador -> CAPI
  api/admin/*              # rotas protegidas por sessão: login, logout, save (conteúdo),
                           # properties, leads, upload, zip, migrate, mapas
components/                # seções do site (Header, Hero, PropertyCard, MetaPixel…)
components/admin/
  AdminForm.jsx            # painel: abas, auto-save, imóveis (funil/lista), templates…
  fields.jsx               # campos de formulário e upload de imagens compartilhados
  MapaMentalTab.jsx        # aba Mapa mental (ponte React <-> módulo)
  mapa/mapaMental.js       # módulo do mapa mental (JS puro, sem bibliotecas)
lib/
  content.js               # conteúdo padrão + seoFor() (fonte da verdade da marca)
  properties.js            # modelo do imóvel, normalização e salvamento mesclado
  leads.js                 # contatos do formulário
  mapas.js                 # mapas mentais (um registro por mapa)
  store.js / supabase.js   # leitura/gravação: Supabase se configurado, senão data/*.json
  auth.js                  # sessão assinada (HMAC), senha e freio de tentativas
  metaCapi.js, sheetLog.js # rastreamento
```

## Painel (`/admin`)

Abas: **Imóveis**, **Mapa mental**, **Equipe & Funil**, **Templates** (marca, cores, SEO, capa, seções, menu, formulário, rodapé), **Tracking** (Pixel, CAPI, planilha) e **Contatos**. Tudo é salvo automaticamente.

### Imóveis
- Visões **Funil (Kanban)** e **Lista**. O funil e a equipe vêm da aba *Equipe & Funil* (configuráveis por cliente). A última etapa do funil é sempre "no site": arrastar para ela publica.
- Cadastro novo nasce como **rascunho** (não aparece no site). **Situação** vira badge no site: disponível, exclusividade, vendido, alugado.
- **Entrada rápida** (texto bruto, fotos, operação, valor), links do Drive, checklist de divulgação (carrossel, reels, anúncio) e organizador da vitrine (Capa, Destaques e Listagem com ordens independentes).
- Fotos do iPhone (HEIC) são convertidas para JPG (no navegador e, como garantia, no servidor).

### Mapa mental
Editor de mapas mentais no estilo MindMaster, dentro do painel:
- Modelos prontos (captação, divulgação, campanha de anúncios, pauta da semana, jornada do cliente, reunião), importar texto/Markdown, exportar PNG, SVG e Markdown.
- 7 layouts, 9 temas, estilos de ramo, marcas (prioridade, progresso, bandeiras, emojis), notas, links, etiquetas, relações, resumos, limites, localizar, estrutura de tópicos, tela cheia e modo apresentação.
- **Integração com imóveis:** um tópico pode ser **vinculado a um imóvel** (clicar no selo abre o imóvel no editor) ou **virar um imóvel rascunho**, com o caminho do tópico no texto bruto.
- Atalhos: Tab (subtópico), Enter (irmão), F2 (editar), Delete, Espaço (recolher), Ctrl+Z/Y, Ctrl+C/X/V, Ctrl+F.
- Cada mapa é salvo como um registro próprio (`mapa:<id>` no Supabase ou `data/mapas/<id>.json` local). Outras pessoas veem as mudanças em até ~15 s.

### Contatos
Envios do formulário do site: marcar como lido, excluir, abrir no WhatsApp.

## Dados e segurança
- **Armazenamento:** com `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, tudo vai para a tabela `singletons` e o bucket `uploads`. Sem elas, vai para `data/*.json` e `public/uploads/`.
- **Salvamento mesclado (várias pessoas no painel):** o servidor nunca sobrescreve a lista inteira.
  - Imóveis: cada imóvel tem `updatedAt`, e a versão mais recente de cada um prevalece. Imóvel criado por outra pessoa é mantido, e só sai da base o que foi excluído explicitamente.
  - Contatos: o painel só envia "lido" e exclusões. Um contato que chega pelo site com o painel aberto nunca é apagado.
  - Limite: se duas pessoas editarem o **mesmo** imóvel ao mesmo tempo, vale a última edição daquele imóvel.
- **Login:** a sessão é um cookie assinado (HMAC-SHA256) que expira em 7 dias e não contém a senha. Após 5 senhas erradas, o IP espera 5 minutos. Trocar `ADMIN_PASSWORD` (ou definir `SESSION_SECRET`) derruba todas as sessões.
- Em **produção**, `ADMIN_PASSWORD` é obrigatória: sem ela o painel fica bloqueado. A senha padrão `paula2026` só vale em desenvolvimento.

## Novo cliente (revenda)
1. Clonar e deployar (ver [DEPLOY.md](DEPLOY.md)) com `ADMIN_PASSWORD` própria e, se houver domínio, `NEXT_PUBLIC_SITE_URL`.
2. **Templates → Marca & Cores:** nome, subtítulo, cores e SEO (campos de SEO em branco são gerados a partir da marca).
3. **Templates → Menu & Contato:** WhatsApp, telefone, conselho (CRECI-SP…), redes e mensagem padrão do WhatsApp.
4. **Equipe & Funil:** pessoas (nome, cor, emoji, função) e etapas do Kanban.
5. **Tracking:** Pixel ID, token da CAPI (fica só no servidor) e webhook da planilha.
6. Textos, fotos e links das seções em **Templates**.

## Design tokens
Cores e tipografia ficam em `tailwind.config.js` e `app/globals.css` (`:root`). As cores da marca são aplicadas em tempo real via CSS variables (`components/ThemeStyle.jsx`).
