# Artec CRM - Homologation Runbook

## Objetivo

Validar o CRM em ambiente conectado antes de considerar uma entrega pronta para uso pela Artec.

## Pre-requisitos

- `.env.local` configurado.
- Backend com acesso ao banco de homologacao.
- Usuario real de homologacao com membership ativa.
- Para E2E, definir `EMAIL_LOGIN` e `SENHA`.
- Nao usar banco de producao para testes destrutivos.

## Subir Ambiente Local

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev:frontend
```

URLs esperadas:

- Frontend: `http://localhost:3100`
- Backend: `http://localhost:4100`
- Health: `http://localhost:4100/api/health`

## Gates Tecnicos

Rodar antes de abrir PR ou entregar:

```bash
npm run typecheck
npm run build:frontend
npm run build:server
npm run test
```

Quando houver credenciais de homologacao:

```bash
npm run e2e
```

## Roteiro Manual

### 1. Login

- Entrar com usuario real.
- Confirmar redirecionamento para Central Comercial.
- Confirmar que usuario sem membership ativa nao acessa o app.

### 2. Central Comercial

Verificar:

- metricas de acoes vencidas, hoje, visitas, orcamentos, sem acao e Caixa Auvo;
- barra de filas compacta;
- drawer de filtros;
- paineis Prioridade agora, Agenda e visitas, Orcamentos aguardando retorno, Higiene do funil, Alertas relevantes e Resumo comercial;
- ausencia de overflow horizontal em desktop e mobile.

### 3. Proximas Acoes

Verificar:

- filtros por responsavel, categoria e prioridade;
- concluir acao;
- reagendar acao;
- cancelar acao;
- registrar resultado;
- abrir cliente e oportunidade a partir da acao.

### 4. Cadastro Rapido

Verificar:

- criar cliente com poucos campos;
- detectar telefone duplicado;
- criar oportunidade;
- definir responsavel, proxima acao e data;
- impedir oportunidade ativa sem proxima acao.

### 5. Ficha da Oportunidade

Verificar:

- dados principais;
- etapa e situacao;
- proxima acao sempre visivel;
- historico;
- visitas;
- orcamentos;
- aprovar com valor aprovado, forma de pagamento, parcelas e previsao de execucao;
- perder com motivo.

### 6. Ficha do Cliente

Verificar:

- cadastro;
- enderecos;
- equipamentos;
- oportunidades;
- atividades;
- aba de garantia e suporte;
- aviso de possivel telefone duplicado.

### 7. Garantia, Suporte e Pos-venda

Verificar:

- registrar como historico/atividade do cliente;
- criar proxima acao quando necessario;
- nao criar oportunidade comercial automaticamente.

### 8. Caixa Auvo

Verificar:

- lista por status;
- painel de decisao;
- resumo de sinais;
- match Cliente-Auvo;
- criar oportunidade;
- vincular oportunidade;
- registrar garantia;
- registrar suporte;
- registrar pos-venda;
- cadastrar cliente;
- marcar nao comercial;
- marcar duplicado.

### 9. Relatorios

Verificar:

- indicadores principais;
- oportunidades por etapa;
- conversao por origem;
- eficiencia de follow-up;
- linguagem comercial sem termos financeiros.

### 10. Mobile e Acessibilidade

Verificar:

- Central Comercial em 390px;
- Proximas Acoes em 390px;
- navegação por teclado;
- foco visivel;
- sem texto sobreposto;
- sem overflow horizontal.

## Comandos Auvo de Homologacao

```bash
npm run auvo:homologation:status
npm run auvo:events:reconcile
npm run auvo:signals:backfill
npm run auvo:customers:match-dry-run
```

## Criterio de Saida

A entrega esta homologada quando:

- gates tecnicos passam;
- E2E passa no ambiente conectado ou a impossibilidade esta documentada;
- fluxo manual das 10 areas foi verificado;
- falhas bloqueantes foram corrigidas ou registradas como pendencia explicita.
