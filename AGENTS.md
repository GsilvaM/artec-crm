# AGENTS.md — Artec CRM

## Missão do produto

Construir um CRM comercial independente para a Artec Ambientes Climatizados, voltado à organização de leads, clientes, oportunidades, orçamentos, follow-ups, agenda comercial, histórico de relacionamento e integração de entrada com o Auvo.

O sistema deve reduzir esquecimentos, tornar a próxima ação evidente e permitir gestão comercial por período. Ele NÃO é um ERP, NÃO é financeiro e NÃO deve virar uma planilha disfarçada de kanban.

Leia também, antes de implementar:

- `docs/PRODUCT-SPEC.md`
- `docs/DESIGN-SYSTEM.md`
- `docs/NOTIFICATIONS.md`
- `docs/AUVO-INTEGRATION.md`
- `docs/IMPLEMENTATION-PLAN.md`, quando existir

## Invariantes de negócio — não violar

1. **Cliente e oportunidade são entidades diferentes.** Um cliente pode ter várias oportunidades ao longo do tempo.
2. **Etapa, situação e próxima ação são conceitos diferentes.** Não criar colunas de funil para cada motivo de espera.
3. **Toda oportunidade ativa deve ter responsável, próxima ação e data da próxima ação.** O sistema deve impedir ou destacar qualquer exceção.
4. **Garantia e suporte não geram oportunidade.** Devem ser vinculados ao histórico do cliente e podem ter tarefas de atendimento próprias.
5. **O CRM não se conecta ao financeiro.** Valor aprovado existe apenas para relatório comercial.
6. **Webhook do Auvo não cria oportunidade automaticamente.** Ele cria uma entrada para triagem na Caixa de Entrada do Auvo.
7. **O vendedor decide a classificação comercial.** Automação pode sugerir, nunca deve classificar silenciosamente casos ambíguos.
8. **Atendimento concluído no Auvo não significa oportunidade concluída, aprovada ou perdida.**
9. **Nenhum evento financeiro do Auvo entra no CRM.**
10. **O histórico é auditável e não deve ser reescrito silenciosamente.** Correções devem gerar novos eventos de auditoria.
11. **Não avançar para Auvo antes da fundação persistente.** Autenticação, RBAC, migrations, Clientes, Oportunidades, próximas ações, auditoria e Central Comercial devem estar implementados com persistência real e aprovados antes de qualquer integração Auvo.
12. **Não usar mocks para declarar fase pronta.** Seeds podem existir somente para testes locais automatizados e devem ficar separados do ambiente real.

## Arquitetura definida

- O CRM é um projeto independente em `C:\Users\Artec Climatizados\Desktop\artec-crm`, com build, envs, deploy, URL, backend, rotas, autenticação e permissões próprias.
- O banco usa o mesmo PostgreSQL/Supabase do projeto, mas apenas nos schemas `crm` e `crm_internal`.
- Dados funcionais ficam em `crm`.
- Dados internos, webhooks, jobs, logs e historico de migrations ficam em `crm_internal`.
- Autenticação usa Supabase Auth do mesmo projeto.
- Acesso ao CRM exige membership ativa em `crm.user_memberships`.
- Usuario existente no Artec Gestao nao recebe acesso automatico ao CRM.
- Nao criar tabelas do CRM em `public`.
- Nao criar foreign keys, views, imports ou consultas misturando CRM e financeiro.
- Nao modificar migrations, Prisma schema, services, rotas ou tabelas financeiras.
- O token Auvo exposto anteriormente deve ser considerado comprometido, revogado e substituido antes de homologacao.

## Ordem oficial de desenvolvimento

1. Fundação.
2. Clientes.
3. Oportunidades.
4. Atividades e próximas ações.
5. Central Comercial.
6. Notificações.
7. Receptor de homologação do Auvo.
8. Captura de payloads reais.
9. Caixa de Entrada do Auvo.
10. Automações posteriores.

## Escopo funcional do MVP

### Áreas principais

- Visão Geral / Central Comercial
- Caixa de Entrada do Auvo
- Leads e oportunidades
- Funil comercial
- Follow-ups
- Agenda comercial
- Clientes
- Orçamentos
- Histórico e atividades
- Notificações
- Relatórios comerciais
- Configurações e integração

### Funil padrão

As etapas devem ser configuráveis, mas o seed inicial deve conter, nesta ordem:

1. Novo lead
2. Em atendimento
3. Visita ou avaliação
4. Orçamento em elaboração
5. Orçamento enviado
6. Negociação
7. Aprovado
8. Concluído

Saídas laterais, fora do fluxo ativo:

- Pausado
- Perdido

Não criar etapa “financeiro”, “pago”, “conta a receber” ou equivalentes.

### Situações padrão

- Em andamento
- Aguardando cliente
- Aguardando responsável interno
- Aguardando visita
- Aguardando orçamento
- Aguardando fornecedor
- Aguardando condomínio/obra/área técnica
- Sem retorno
- Agendado
- Pausado

Situações não substituem etapas e não devem multiplicar colunas do kanban.

### Aprovação comercial

Ao aprovar uma oportunidade, exigir:

- valor aprovado;
- forma de pagamento;
- quantidade de parcelas;
- previsão de execução.

Regras:

- À vista define automaticamente 1 parcela.
- Os dados alimentam apenas relatórios comerciais.
- Não criar cobrança, conta, lançamento, movimentação ou integração financeira.

## Caixa de Entrada do Auvo

A Caixa de Entrada é a ponte entre webhook e CRM. Cada `Atendimento criado` gera no máximo um item, identificado pelo atendimento externo e protegido contra duplicidade.

Status:

- novo
- em análise
- aguardando dados
- processado
- descartado
- erro de integração

Ações de triagem:

- criar nova oportunidade;
- vincular a oportunidade existente;
- novo serviço para cliente existente;
- registrar garantia;
- registrar suporte;
- registrar pós-venda;
- cadastrar somente como cliente;
- marcar como não comercial;
- marcar como duplicado.

Ao criar oportunidade pela caixa, exigir responsável, próxima ação e data. Preencher automaticamente tudo que for confiável e permitir revisão antes de salvar.

Ao classificar como garantia ou suporte:

- localizar ou criar o cliente;
- registrar evento na linha do tempo;
- permitir tarefa de atendimento, anexos e observações;
- não criar oportunidade;
- não afetar conversão, pipeline ou valores comerciais.

## Follow-ups e atividades

Tipos de atividade comercial:

- mensagem;
- ligação;
- visita;
- orçamento enviado;
- follow-up;
- observação;
- mudança de etapa;
- aprovação;
- perda.

Tipos de atividade de atendimento:

- garantia;
- suporte;
- pós-venda;
- solicitação de documento;
- análise técnica;
- visita de atendimento;
- confirmação de solução.

Regras:

- Follow-up vencido deve permanecer visível até ser concluído, reagendado ou cancelado com motivo.
- Concluir um follow-up deve permitir registrar resultado e criar a próxima ação no mesmo fluxo.
- O sistema deve detectar oportunidades ativas sem próxima ação e sinalizá-las como inconsistência.
- Automação de follow-up deve ser configurável, explicável e nunca mover para perdido sem regra aprovada e registro de auditoria.

## Modelo conceitual mínimo

Use nomes coerentes com a stack, mantendo as responsabilidades:

- users
- customers
- opportunities
- pipeline_stages
- opportunity_stage_history
- opportunity_statuses ou situations
- activities
- follow_ups / tasks
- quotes
- loss_reasons
- lead_sources
- tags e relações
- customer_timeline_events
- auvo_inbox_items
- auvo_webhook_events
- auvo_external_links
- notifications
- notification_preferences
- audit_log

Requisitos de dados:

- IDs internos estáveis, preferencialmente UUID.
- Unicidade de IDs externos do Auvo quando presentes.
- Telefone normalizado e indexado.
- Soft delete somente quando necessário; auditoria deve permanecer.
- Índices para responsável, etapa, próxima ação, status, telefone e datas.
- Separar payload bruto de campos normalizados.
- Não armazenar mensagens completas do WhatsApp no MVP.

## Integração Auvo — MVP

Eventos aceitos inicialmente:

- Atendimento criado
- Atendimento alterado
- Atendimento concluído
- Contato criado
- Contato alterado

Eventos proibidos no MVP:

- Pagamento criado/alterado
- eventos financeiros
- eventos de painel/card
- mensagens recebidas/enviadas/atualizadas
- modelos de mensagem

Direção da integração:

- Webhook: Auvo → CRM.
- API: CRM → Auvo, apenas leitura e somente para completar dados faltantes.
- Nenhuma escrita no Auvo no MVP.

Requisitos técnicos:

- endpoint HTTPS público;
- resposta rápida 2xx antes do processamento pesado;
- persistir evento bruto antes de processar;
- idempotência por ID externo e fallback por hash;
- fila/job assíncrono quando a infraestrutura permitir;
- tentativas controladas e dead-letter/reprocessamento;
- logs sanitizados;
- validação de assinatura oficial se o Auvo oferecer;
- caso não ofereça, usar URL secreta, rate limit, validação de schema e conferência de IDs pela API;
- tela administrativa para testar conexão, ver últimos eventos, erros e reprocessar.

Não inventar payloads do Auvo. Primeiro criar receptor de homologação, capturar payloads reais e só então implementar mapeamento definitivo.

## Design e experiência

O produto é desktop-first, responsivo e rápido. Use o design system descrito em `docs/DESIGN-SYSTEM.md`.

Princípios obrigatórios:

- Central Comercial é a tela inicial; kanban não é a única visão.
- Mostrar primeiro o que exige ação hoje.
- Formulários curtos, progressivos e com valores predefinidos sensatos.
- Ações frequentes em um ou dois cliques.
- Busca global por nome, telefone e empresa.
- Lista + painel lateral para triagens rápidas.
- Kanban com ações rápidas; drag-and-drop pode coexistir, mas não ser obrigatório.
- Estados vazios com orientação útil.
- Acessibilidade por teclado, foco visível, contraste adequado e labels.
- Datas e valores no padrão pt-BR.
- Linguagem simples, direta e profissional.
- Não usar excesso de cards, sombras, gradientes, animações ou cores sem significado.
- Não esconder ações essenciais em menus de três pontos quando há espaço.

## Notificações

Aplicar `docs/NOTIFICATIONS.md`.

Resumo obrigatório:

- Toasts apenas para confirmação imediata e erro local.
- Central persistente no sino para eventos que exigem ação.
- Badge com quantidade não lida/pendente.
- Notificações acionáveis, deduplicadas e com link direto ao contexto.
- Priorizar: novo atendimento Auvo, follow-up vencido, follow-up de hoje, atribuição, oportunidade sem próxima ação e erro de integração.
- Não notificar cada alteração de campo.
- Permitir marcar como lida, arquivar, adiar e configurar preferências.

## Relatórios comerciais

Filtros por período, responsável, origem, serviço e etapa.

Métricas mínimas:

- novos leads;
- oportunidades criadas;
- oportunidades por etapa;
- valor orçado;
- valor aprovado;
- número de aprovações;
- ticket médio aprovado;
- taxa de conversão;
- conversão por origem;
- motivos de perda;
- tempo médio até orçamento;
- tempo médio até aprovação/perda;
- follow-ups vencidos e realizados;
- taxa de recuperação após follow-up;
- tempo médio de triagem da Caixa de Entrada.

Nunca apresentar valor aprovado como receita recebida ou faturamento financeiro. Usar termos “valor aprovado” e “vendas aprovadas”.

## Papéis e permissões

Perfis iniciais:

- gestor: vê tudo, configura funil, integrações, usuários e relatórios;
- vendedor: gerencia seus clientes/oportunidades e executa triagens permitidas;
- atendimento, se necessário: processa caixa, garantia, suporte e pós-venda sem acesso administrativo.

Autorização deve ser verificada no servidor/banco, não apenas escondendo botões.

## Testes e critérios de aceite

Cobrir no mínimo:

- criação manual de cliente e oportunidade;
- bloqueio/alerta de oportunidade ativa sem próxima ação;
- mudança de etapa com histórico;
- aprovação com os quatro campos obrigatórios;
- perda com motivo;
- follow-up vencido, concluído e reagendado;
- triagem Auvo para nova oportunidade;
- vínculo com oportunidade existente;
- garantia/suporte sem oportunidade;
- webhook duplicado não duplica entrada;
- atendimento concluído no Auvo não fecha oportunidade;
- permissões por perfil;
- notificações deduplicadas;
- relatórios não incluem garantia/suporte como oportunidade;
- nenhuma referência ao financeiro.

## Fases de entrega

1. Fundação, autenticação, design system e modelo de dados.
2. Clientes, oportunidades, histórico e funil.
3. Próximas ações, follow-ups, agenda e notificações.
4. Caixa de Entrada e receptor Auvo em homologação.
5. Mapeamento real dos webhooks e API de leitura.
6. Orçamentos, aprovação, perdas e relatórios.
7. Hardening: segurança, observabilidade, performance, acessibilidade e testes E2E.

Cada fase deve terminar com um fluxo utilizável, testes e documentação. Não construir telas desconectadas do backend apenas para aparentar progresso.
