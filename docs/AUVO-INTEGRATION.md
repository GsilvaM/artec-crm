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
- comparacao do segredo em tempo constante (`node:crypto.timingSafeEqual`), sem short-circuit por tamanho;
- rate limit de 60 requisicoes/minuto por IP na rota publica (`POST` e fallback `405`), com resposta `429` sanitizada (`rate_limited`);
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

### Diagnostico seguro da captura

Antes de configurar o Auvo, rode:

```powershell
npm run auvo:homologation:status
```

O comando nao imprime segredo, headers nem payloads. Ele informa apenas:

- se `AUVO_WEBHOOK_SECRET` esta configurado;
- total de eventos recebidos;
- eventos sinteticos marcados com `homologation=true`;
- eventos provavelmente reais;
- pendentes, falhas, ignorados e processados;
- data do ultimo evento recebido.

Para liberar o proximo marco, e necessario capturar payloads reais suficientes para cobrir:

- atendimento criado com contato novo;
- atendimento criado com contato existente;
- atendimento alterado;
- atendimento concluido;
- contato criado;
- contato alterado;
- evento repetido;
- payload sem telefone;
- erro temporario ou indisponibilidade relacionada a API, se ocorrer durante a homologacao.

Sem essas amostras, nao mapear campos e nao implementar Caixa de Entrada definitiva.

### Exportacao local de fixtures anonimizadas

Depois que `likelyRealEvents` for maior que zero, gere fixtures locais:

```powershell
npm run auvo:fixtures:export
```

O comando grava arquivos em:

```text
tmp/auvo-fixtures
```

Esse diretorio e ignorado pelo Git. Antes de qualquer fixture ser versionada futuramente, revisar manualmente se a anonimização removeu:

- nomes de clientes/contatos;
- telefones e WhatsApp;
- e-mails;
- documentos;
- enderecos;
- textos livres de mensagens/observacoes;
- tokens, chaves, assinaturas e cookies.

## 12. Schema real observado (mapeamento oficial, 2026-07-21)

Capturado com um contato real e um atendimento real (criar, alterar, enviar mensagem, concluir), com apenas os 5 eventos do MVP habilitados no Auvo. Documentado por estrutura (nomes e tipos de campo), nunca por valor — nenhum dado pessoal foi copiado para este arquivo.

### Descoberta central: "Atendimento" = sessao de chat, nao ordem de servico

Os eventos `SESSION_NEW`, `SESSION_UPDATE` e `SESSION_COMPLETE` sao o que a tela do Auvo chama de "Atendimento criado/alterado/concluido". A estrutura do payload confirma que, nesta conta Auvo, um "atendimento" e uma **sessao de conversa** (WhatsApp/Instagram/canal, com bot e/ou agente humano) — nao uma ordem de servico tecnica com tecnico, data de visita e equipamento, como o termo poderia sugerir. Isso e informacao nova que nao estava disponivel antes da captura real; a decisao de nao presumir nomes de campo (regra do `CLAUDE-ARTEC-CRM.md`) evitou que essa suposicao errada fosse implementada.

Implicacao direta para a Caixa de Entrada (Marco 7, ainda nao iniciado): cada `SESSION_NEW` representa uma nova conversa de atendimento comercial iniciada com um contato, nao uma visita tecnica agendada. O fluxo de triagem deve tratar isso como "novo atendimento via chat aguardando classificacao comercial", nao como "ordem de servico".

### `CONTACT_NEW` / `CONTACT_UPDATE`

Nome real do tipo de evento no campo `eventType` do payload (nao inferido, lido diretamente do payload capturado).

```
{
  date: string (timestamp do evento)
  eventType: string
  content: {
    id: string (ID do contato no Auvo — candidato a auvo_contact_id)
    name: string
    phonenumber: string
    phonenumberFormatted: string
    email: string | null
    status: string
    origin: string
    active: boolean
    tags: string[]
    tagsId: string[]
    companyId: string
    createdAt: string (ISO)
    updatedAt: string (ISO)
    nameWhatsapp: string | null
    nameInstagram: string | null
    nameMessenger: string | null
    instagram: object | null
    messengerId: string | null
    pictureUrl: string | null
    pictureFileId: string | null
    annotation: string | null
    utm: object | null
    metadata: object
    customFieldValues: object
  }
  changeMetadata: {            // presente em CONTACT_UPDATE; ausente/vazio em CONTACT_NEW
    source: string
    userId: string
    changes: Array<{ property: string; currentValue: string; previousValue: string }>
  }
}
```

Campos confiaveis para identificacao de cliente (ordem de prioridade ja definida na secao 12 deste documento, agora confirmada como implementavel): `content.id` (auvo_contact_id), `content.phonenumberFormatted` (telefone), `content.email`.

### `SESSION_NEW` / `SESSION_UPDATE` / `SESSION_COMPLETE`

```
{
  date: string
  eventType: string
  content: {
    id: string (ID da sessao/atendimento no Auvo)
    contactId: string (referencia ao contato — chave de ligacao com CONTACT_*)
    status: string
    active: boolean
    expired: boolean
    number: string
    startAt: string (ISO)
    endAt: string | null (ISO; nulo enquanto o atendimento nao e concluido)
    createdAt: string (ISO)
    updatedAt: string (ISO)
    channelType: string (canal: whatsapp, instagram, etc.)
    channelId: string
    channelDetails: { id, platform, provider, displayName, pictureUrl, providerVariable }
    companyId: string
    departmentId: string
    departmentDetails: { id, name, companyId, description }
    botId: string | null
    botVersionId: string | null
    agentDetails: {            // presente quando ha agente humano atribuido; nulo/ausente em SESSION_NEW inicial
      id: string
      name: string
      email: string
      userId: string
      shortName: string
      phoneNumber: string
      pictureUrl: string | null
      pictureFileId: string | null
    } | null
    contactDetails: {          // subconjunto do contato, mesma forma de CONTACT_*
      id, name, phonenumber, phonenumberFormatted, email, status, tagsId, tagsName, instagram, pictureUrl
    }
    windowStatus: string
    waitReply: boolean
    unreadCount: number
    lastMessageIn: string | null (ISO)
    lastMessageOut: string | null (ISO)
    lastMessageText: string | null   // texto livre da ultima mensagem — nunca deve ser exibido/persistido fora do payload bruto sanitizado
    firstUserInteractionAt: string | null (ISO)
    firstAgentMessageAt: string | null (ISO)
    lastInteractionDate: string (ISO)
    previousSessionId: string | null
    classification: object | null
    metadata: object
    readTimestamp: string | null
    previewUrl: string | null
    utm: object | null
  }
  changeMetadata: {           // presente em SESSION_UPDATE/SESSION_COMPLETE; ausente/vazio em SESSION_NEW
    source: string
    userId: string
    changes: Array<{ property: string; currentValue: string; previousValue: string }> | object
  }
}
```

Campos confiaveis para o parser definitivo (Marco 7):

- ID externo do evento/atendimento: `content.id` (unico por sessao; estavel entre `SESSION_NEW`/`SESSION_UPDATE`/`SESSION_COMPLETE` do mesmo atendimento).
- Vinculo com o contato: `content.contactId`, cruzado com `content.id` dos eventos `CONTACT_*`.
- Diferenciacao criado/alterado/concluido: pelo `eventType` em si (`SESSION_NEW`/`SESSION_UPDATE`/`SESSION_COMPLETE`), nao pelo campo `status` (que tambem existe mas seu conjunto de valores possiveis ainda nao foi totalmente observado).
- `endAt` so aparece preenchido em `SESSION_COMPLETE`.
- `changeMetadata.changes` em `SESSION_UPDATE` mostra exatamente quais propriedades mudaram — util para decidir se uma atualizacao e relevante para a Caixa de Entrada ou apenas ruido (ex: `unreadCount` mudando sozinho).

**Ainda nao observado nesta captura**, portanto nao mapeado: atendimento concluido sem nunca ter tido agente humano (so bot), atendimento com contato sem telefone, evento de erro/indisponibilidade da API. O Marco 7 (parser definitivo) so deve cobrir os casos ja observados; casos adicionais exigem nova captura antes de serem tratados no codigo, pela mesma regra de nao presumir payload.

### Eventos fora de escopo confirmados nesta captura (bloqueados, payload nao persistido)

`MESSAGE_SENT` foi recebido (o usuario enviou uma mensagem de teste durante a captura) e corretamente ignorado pelo denylist do backend, sem persistir o texto da mensagem — comportamento esperado, confirma que o hardening do incidente anterior continua funcionando com o SESSION_ removido do denylist.

## 13. Caixa de Entrada (Marco 7, implementado em 2026-07-21)

Parser em `server/crm/auvo-parser.ts` (`parseAuvoSessionPayload`, `isAuvoSessionEventType`): funcoes puras, testadas isoladamente (`server/crm/auvo-parser.test.ts`), sem tocar banco. So processam `eventType` que comeca com `SESSION_` — os demais eventos (`CONTACT_*`, e qualquer outro) nao geram item de triagem.

Fluxo de ingestao (`server/crm/prisma-repository.ts`, metodo `receiveAuvoWebhookEvent`):

1. Payload bruto e persistido em `crm_internal.auvo_webhook_events` normalmente (sem mudanca).
2. Se o `eventType` for `SESSION_*` e nao estiver fora de escopo, o parser extrai `external_service_id` (= `content.id`), `auvo_contact_id`, `contact_name`, telefone (bruto, depois normalizado com a mesma funcao usada em clientes), `email` e `channel_type`.
3. Busca por item de triagem existente com o mesmo `external_service_id` (idempotente): se existir, so atualiza `last_event_id` — cobre `SESSION_UPDATE`/`SESSION_COMPLETE` do mesmo atendimento, e reentregas duplicadas do mesmo `SESSION_NEW`.
4. Se nao existir, cria um novo item com `status = 'novo'` e tenta sugerir um cliente existente, nesta ordem: `auvo_contact_id` -> telefone normalizado -> e-mail. Nunca por nome. Se nada bater, `suggested_customer_id` fica nulo — a tela mostra "Nenhum encontrado" e a decisao fica com quem faz a triagem.
5. Qualquer erro nesse processamento e engolido (nao derruba a resposta `202` do webhook); o payload bruto ja esta salvo e pode ser reconciliado depois.

**Atendimento concluido no Auvo (`SESSION_COMPLETE`) nao fecha nem altera o item de triagem automaticamente** — so atualiza `last_event_id`, conforme invariante do produto (concluir no Auvo != concluir/aprovar/perder no CRM).

### Acoes de triagem (`POST /api/auvo-inbox/:id/resolve`)

Permissao `auvo_inbox:write` (gestor e atendimento). Um item so pode ser resolvido uma vez (`processado` ou `descartado` sao estados finais; tentar resolver de novo retorna `409`).

| Acao | Efeito |
| --- | --- |
| `create_opportunity` | Cria oportunidade via o mesmo fluxo do Marco 2 (`origem` default `"Auvo"`), vincula ao item. |
| `link_opportunity` | Registra uma atividade do sistema na oportunidade informada, vincula ao item, nao cria nada novo. |
| `warranty` / `support` / `after_sales` | Cria atividade do tipo correspondente no cliente informado (Marco 3), sem oportunidade. |
| `customer_only` | So confirma/vincula o cliente, sem criar nada. |
| `not_commercial` / `duplicate` | Marca `status = 'descartado'` com motivo opcional; nao cria nada. |

Nenhuma acao cria cliente novo automaticamente pela Caixa de Entrada nesta fatia — o operador cria o cliente pelo formulario ja existente ("Novo cliente") antes de resolver, se necessario. Decisao deliberada para nao duplicar a validacao de clientes (telefone normalizado, alerta de duplicidade) em dois lugares.

### Backfill unico (nao versionado como script permanente)

Os 3 primeiros eventos `SESSION_*` reais foram capturados antes deste parser existir (ficaram so em `crm_internal.auvo_webhook_events`, sem item de triagem). Um script local unico (nao commitado, rodado uma vez em `tmp/`) reprocessou os eventos `received` existentes e criou os itens retroativamente. Novos eventos a partir de 2026-07-21 sao processados automaticamente pelo fluxo normal do webhook.

O exportador nao deve ser usado como autorizacao para implementar mapeamento definitivo sozinho. Ele apenas prepara material anonimo para analise e testes de contrato apos a captura real.
