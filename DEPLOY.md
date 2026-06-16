# Publicar grátis — Vercel + Supabase

O site funciona de dois jeitos automaticamente:

- **Sem Supabase** (no seu PC): salva tudo em arquivos na pasta `data/` e `public/uploads/`.
- **Com Supabase** (na Vercel): salva no banco de dados e as imagens no Storage do Supabase.

Basta preencher as variáveis do Supabase para ele ativar o modo nuvem. Siga os passos abaixo.

---

## 1. Criar o projeto no Supabase (grátis)

1. Acesse https://supabase.com e crie uma conta (pode entrar com o Google).
2. Clique em **New project**. Dê um nome (ex: `paula-regina`), defina uma senha de banco (guarde) e escolha a região **South America (São Paulo)**.
3. Aguarde ~2 minutos até o projeto ficar pronto.

## 2. Criar a tabela do conteúdo

No menu lateral, vá em **SQL Editor → New query**, cole o código abaixo e clique em **Run**:

```sql
create table if not exists singletons (
  key text primary key,
  data jsonb,
  updated_at timestamptz default now()
);

alter table singletons enable row level security;
-- Sem políticas: só o servidor (service_role) acessa. Fica protegido.
```

## 3. Criar o bucket de imagens

1. Menu lateral → **Storage → New bucket**.
2. Nome: **uploads**
3. Marque **Public bucket** (para as fotos abrirem por URL).
4. Clique em **Create bucket**.

## 4. Pegar as chaves

Menu lateral → **Project Settings → API**:

- **Project URL** → vai em `SUPABASE_URL`
- Em *Project API keys*, copie a **`service_role`** (clique em "Reveal") → vai em `SUPABASE_SERVICE_ROLE_KEY`
  - ⚠️ A `service_role` é secreta. Nunca exponha no front-end nem no Git.

## 5. Publicar na Vercel (grátis)

1. Suba o projeto para um repositório no GitHub.
2. Acesse https://vercel.com, entre com o GitHub e clique em **Add New → Project**.
3. Selecione o repositório e clique em **Import**.
4. Antes de **Deploy**, abra **Environment Variables** e adicione:

   | Nome | Valor |
   |------|-------|
   | `ADMIN_PASSWORD` | a senha do painel (ex: `adminpaula2026@`) |
   | `SUPABASE_URL` | a Project URL do passo 4 |
   | `SUPABASE_SERVICE_ROLE_KEY` | a chave service_role do passo 4 |

5. Clique em **Deploy**. Em ~1 min o site estará no ar (ex: `paula-regina.vercel.app`).

## 6. Primeiro acesso

1. Abra `https://SEU-SITE.vercel.app/admin` e entre com a senha.
2. Cadastre imóveis e edite os textos — agora tudo é salvo no Supabase.
3. Para domínio próprio (ex: `paularegina.com.br`): Vercel → projeto → **Settings → Domains**.

---

## Testar o modo Supabase no PC (opcional)

Cole as chaves no `.env.local` (descomentando as linhas) e rode `npm run dev`. O site passa a ler/gravar no Supabase em vez dos arquivos.

## Observações

- Os dados de exemplo (6 imóveis e textos padrão) aparecem automaticamente até você salvar pela primeira vez no admin.
- O plano grátis do Supabase e da Vercel é suficiente para um site de corretor. Sem custo.
