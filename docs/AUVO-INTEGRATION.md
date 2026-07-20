# Artec CRM — Integração com o Auvo

## 1. Escopo

A integração serve para reduzir digitação e capturar atendimentos comerciais. Não conecta o CRM ao financeiro do Auvo e não transforma o CRM em uma cópia das conversas.

## 2. Eventos do MVP

Configurar no Auvo:

- Atendimento criado
- Atendimento alterado
- Atendimento concluído
- Contato criado
- Contato alterado

Não configurar no MVP:

- Mensagem atualizada
- Mensagem recebida
- Mensagem enviada
- Contato etiqueta alterada
- Pagamento criado
- Pagamento alterado
- Painel/Card/Anotação
- Modelo de mensagem

## 3. Fluxo

1. Auvo envia webhook HTTPS.
2. Endpoint valida o básico e persiste o payload bruto.
3. Endpoint responde 2xx rapidamente.
4. Worker/processador verifica idempotência.
5. Campos conhecidos são normalizados.
6. Se necessário, backend consulta a API do Auvo em modo leitura.
7. CRM cria/atualiza item na Caixa de Entrada.
8. Vendedor classifica manualmente.

## 4. Caixa de Entrada

Um atendimento externo corresponde a no máximo um item. O CRM sugere cliente por:

1. `auvo_contact_id`;
2. telefone normalizado;
3. e-mail;
4. nome aproximado apenas como sugestão.

O vendedor escolhe o destino. Nunca vincular automaticamente apenas por nome.

## 5. Idempotência

Prioridade:

1. ID único do evento, se fornecido;
2. ID do atendimento + tipo de evento + versão/timestamp;
3. hash canônico do payload como fallback.

Usar constraints únicas no banco, não apenas verificação em memória.

## 6. Segurança

- HTTPS obrigatório.
- Segredos apenas no backend.
- `.env.example` sem valores reais.
- Assinatura oficial do Auvo, se disponível, deve ser validada.
- Se não houver assinatura: URL secreta, rate limit, validação de schema, logs de IP/headers sanitizados e verificação posterior de IDs pela API.
- Não registrar token em logs.
- Rotacionar o token exposto durante o planejamento antes da homologação.

## 7. Autenticação da API

Criar um módulo isolado para:

- obter token temporário com API Key + API Token;
- armazenar token somente no servidor;
- renovar antes da expiração;
- serializar renovações concorrentes para evitar várias autenticações;
- tratar 401 com uma única renovação e retry controlado;
- respeitar rate limit;
- registrar métricas sem expor credenciais.

Não assumir endpoints ou formatos. Confirmar na documentação oficial e em respostas reais.

## 8. Homologação obrigatória

Antes de mapear eventos, criar um receptor de homologação que salve payload e headers sanitizados. Capturar amostras reais de:

- atendimento novo com contato novo;
- atendimento novo com contato existente;
- atendimento alterado;
- atendimento concluído;
- contato criado;
- contato alterado;
- evento repetido;
- payload sem telefone;
- indisponibilidade temporária da API.

Criar fixtures anonimizadas a partir das amostras e testes de contrato.

## 9. Observabilidade

Tela administrativa com:

- integração ativa/inativa;
- teste de conexão;
- último webhook recebido;
- último evento processado;
- fila pendente;
- eventos com erro;
- tentativas;
- reprocessamento manual;
- payload sanitizado;
- correlação entre evento, atendimento, cliente e oportunidade.

## 10. Estados técnicos do evento

- received
- processing
- processed
- ignored
- failed
- dead_letter

Erros devem ser reprocessáveis sem duplicar dados.

## 11. Marco 6 - Receptor de homologacao

Implementado localmente para capturar amostras reais antes de qualquer mapeamento definitivo:

- `POST /api/webhooks/auvo/:secret`
- `GET /api/integrations/auvo/status`
- `GET /api/integrations/auvo/events`
- `GET /api/integrations/auvo/events/:id`
- `POST /api/integrations/auvo/events/:id/reprocess`
- `POST /api/integrations/auvo/events/:id/ignore`

Garantias atuais:

- segredo apenas no backend via `AUVO_WEBHOOK_SECRET`;
- sem `VITE_` para segredo;
- somente `POST` e `application/json`;
- limite de payload de 256 KiB;
- headers persistidos somente por allowlist;
- `authorization`, `cookie`, `set-cookie`, tokens e chaves privadas nao sao armazenados;
- payload bruto preservado em `crm_internal.auvo_webhook_events`;
- resposta rapida `202` sem chamada lenta a API do Auvo;
- deduplicacao por hash canonico do payload;
- tela administrativa restrita a gestor;
- payload exibido no frontend e sanitizado recursivamente;
- reprocessamento e ignorar manuais alteram somente status tecnico;
- sucesso comum de webhook nao gera notificacao.

Fora do Marco 6:

- criacao automatica de clientes;
- criacao automatica de oportunidades;
- Caixa de Entrada definitiva;
- leitura da API Auvo;
- escrita/sync de volta para Auvo;
- pagamentos, financeiro, mensagens completas e card moves.

### Teste local sintetico

Use apenas payload sintetico marcado como homologacao:

```powershell
Invoke-WebRequest `
  -Method POST `
  -Uri "http://127.0.0.1:4100/api/webhooks/auvo/SEU_SEGREDO_LOCAL" `
  -ContentType "application/json" `
  -Body '{"eventType":"attendance.created","id":"synthetic-homologation-1","homologation":true}'
```

Depois acesse a tela administrativa de gestor e confira o evento em "Homologacao Auvo". Nao registre o segredo, tokens ou headers sensiveis em logs, documentos, prompts ou commits.

### Homologacao real futura

1. Rotacionar qualquer credencial exposta antes de homologar.
2. Configurar no Auvo somente os eventos do MVP descritos nesta documentacao.
3. Enviar amostras reais para o receptor.
4. Anonimizar as amostras antes de transforma-las em fixtures.
5. So depois mapear campos reais e implementar Caixa de Entrada/processador.
