# Artec CRM — Deploy na Vercel

## 1. Decisao de arquitetura

Um unico projeto Vercel serve o frontend (Vite, estatico) e o backend (Fastify, como funcao serverless em `/api`) sob o mesmo dominio. Essa decisao evita CORS entre dominios e mantem `VITE_CRM_API_URL=/api` como hoje em desenvolvimento.

- Frontend: build estatico em `dist/` (`npm run build:frontend`).
- Backend: `api/index.ts` empacota o Fastify inteiro (`server/app.ts`) como uma unica funcao serverless. `vercel.json` reescreve qualquer `/api/*` para essa funcao; o roteamento real de cada endpoint continua sendo feito pelo Fastify internamente.
- Nenhuma rota nova foi criada. As mesmas rotas de `server/app.ts`, incluindo `POST /api/webhooks/auvo/:secret`, passam a responder no dominio publico da Vercel.

## 2. O que ja foi preparado no codigo (nao requer acao manual)

- `server/bootstrap.ts`: monta as dependencias do Fastify (Prisma, Supabase, repositories) uma unica vez; usado tanto por `server/index.ts` (processo Node tradicional, dev local) quanto por `api/index.ts` (funcao serverless).
- `api/index.ts`: cacheia a instancia do Fastify entre invocacoes "quentes" da funcao (padrao oficial do Fastify para serverless) e delega a requisicao inteira via `app.server.emit("request", req, res)`.
- `vercel.json`: define `buildCommand`, `outputDirectory: dist` e o rewrite `/api/(.*) -> /api/index`.
- `CRM_DATABASE_POOL_URL` (opcional): quando definida, o runtime usa o pooler de transacao do Supabase (porta 6543, `pgbouncer=true`) em vez do pooler de sessao (porta 5432). Isso evita esgotar conexoes com muitas invocacoes serverless concorrentes. As migrations continuam usando exclusivamente `CRM_DATABASE_URL` (porta 5432), pois usam advisory lock, incompativel com pgbouncer em modo transacao.

## 3. Passos manuais obrigatorios (somente o usuario pode fazer)

1. Criar conta na Vercel (https://vercel.com) e conectar com o GitHub da conta que tem acesso a `https://github.com/GsilvaM/artec-crm`.
2. Importar o repositorio `artec-crm` como um novo projeto Vercel.
3. Durante a configuracao do projeto, definir Framework Preset como "Vite" (ou deixar deteccao automatica) e confirmar `Output Directory = dist` (ja fixado em `vercel.json`).
4. Em Project Settings > Environment Variables, cadastrar (Production e Preview):
   - `CRM_ALLOWED_ORIGINS` — dominio final da Vercel (ex: `https://<projeto>.vercel.app`), separado por virgula se houver mais de um.
   - `CRM_SUPABASE_URL`
   - `CRM_SUPABASE_ANON_KEY`
   - `CRM_DATABASE_URL` — pooler de sessao (porta 5432), o mesmo formato ja usado localmente.
   - `CRM_DATABASE_POOL_URL` — pooler de transacao (porta 6543, `pgbouncer=true`). Recomendado para producao serverless.
   - `AUVO_WEBHOOK_SECRET` — **gerar um valor novo, exclusivo para producao**, diferente do valor local. Nao reaproveitar o segredo local nem qualquer chave do Auvo Chat/API.
   - `CRM_LOG_LEVEL` — `info` (ou `warn` em producao, a criterio do usuario).
   - `VITE_CRM_SUPABASE_URL`, `VITE_CRM_SUPABASE_ANON_KEY` — mesmos valores publicos usados no frontend local.
   - `VITE_CRM_API_URL` — `/api` (mesmo dominio, sem necessidade de URL absoluta).
5. Em Project Settings > General, selecionar a versao do Node.js suportada pela Vercel no momento do deploy (recomendado: a versao LTS mais recente oferecida na lista da Vercel). Nao foi fixado `engines.node` no `package.json` para nao entrar em conflito com o que a Vercel oferecer.
6. Rodar as migrations pendentes contra o mesmo banco Supabase **antes** do primeiro deploy receber trafego real (`npm run db:migrate` a partir de uma maquina com `CRM_DATABASE_URL` de producao configurada). A Vercel nao roda migrations automaticamente; isso continua manual, por design (ver `CLAUDE.md`, secao 6, migrations proprias).
7. Disparar o deploy (import automatico ja dispara o primeiro; deploys seguintes disparam a cada push em `main`, salvo configuracao diferente).
8. Validar `GET https://<dominio-vercel>/api/health` retornando `200` com `database: connected` antes de qualquer outro teste.
9. So depois de validar o `health`, configurar a URL do webhook no painel do Auvo como `https://<dominio-vercel>/api/webhooks/auvo/<AUVO_WEBHOOK_SECRET-de-producao>` e seguir a captura real de payloads (`docs/AUVO-INTEGRATION.md`, secao "Homologacao real futura").

## 4. Fora do escopo deste preparo

- Dominio proprio (`crm.artecclimatizados.com.br`): nao configurado. Se desejado, e feito depois em Project Settings > Domains na Vercel, apontando o DNS do dominio para a Vercel. Ate la, o dominio `*.vercel.app` gerado automaticamente e suficiente para homologacao.
- Rodar o deploy em si: nenhuma acao de deploy foi executada nesta sessao. O codigo esta pronto; a criacao da conta/projeto e as variaveis de ambiente dependem de acao humana com acesso a Vercel e ao Supabase de producao.
