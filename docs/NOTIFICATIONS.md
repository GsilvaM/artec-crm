# Artec CRM — Sistema de notificações

## 1. Objetivo

Notificar apenas quando houver uma ação relevante. O sistema deve ajudar a trabalhar, não gerar ruído.

## 2. Três camadas

### Feedback imediato

Toast temporário para ações locais:

- salvo com sucesso;
- follow-up reagendado;
- erro ao salvar;
- vínculo criado;
- operação desfeita.

Toasts não substituem notificações persistentes.

### Central de notificações

Sino no app com registros persistentes, agrupados por prioridade e data. Cada item deve ter título, contexto, horário, ação principal e link direto.

### Painéis operacionais

Itens vencidos e de hoje também aparecem na Central Comercial. Uma notificação não pode ser o único lugar onde uma obrigação é visível.

## 3. Eventos do MVP

### Alta prioridade

- Follow-up vencido.
- Novo atendimento Auvo sem triagem além do SLA.
- Erro recorrente na integração Auvo.
- Oportunidade ativa sem próxima ação.

### Média prioridade

- Follow-up previsto para hoje.
- Oportunidade atribuída ao usuário.
- Cliente respondeu/atendimento alterado, se houver sinal confiável sem copiar mensagens.
- Orçamento sem retorno além do prazo configurado.
- Visita ou compromisso se aproximando.

### Informativa

- Atendimento do Auvo concluído.
- Importação/processamento concluído.
- Configuração alterada por gestor.

## 4. Ações nas notificações

Quando aplicável:

- Abrir oportunidade.
- Iniciar triagem.
- Marcar follow-up como feito.
- Reagendar.
- Assumir atendimento.
- Ver erro de integração.
- Marcar como lida.
- Arquivar.
- Adiar por período.

## 5. Antirruído

- Deduplicar por entidade + tipo + janela de tempo.
- Atualizar a notificação existente em vez de criar várias iguais.
- Não notificar mudanças feitas pelo próprio usuário quando o feedback por toast for suficiente.
- Não notificar cada edição de campo.
- Agrupar itens semelhantes: “5 follow-ups vencidos”.
- Respeitar horário comercial configurado para alertas futuros externos.
- Limitar lembretes repetidos e registrar quando o usuário adiou.

## 6. Preferências

Por usuário:

- novos atendimentos;
- atribuições;
- follow-ups de hoje;
- vencidos;
- lembrete de visita;
- integração;
- resumo diário.

No MVP, notificações são internas. E-mail, push do navegador e WhatsApp ficam para fase posterior e devem ser opt-in.

## 7. Modelo de dados sugerido

`notifications`:

- id
- user_id
- type
- priority
- title
- body
- entity_type
- entity_id
- action_url
- dedupe_key
- read_at
- archived_at
- snoozed_until
- created_at
- updated_at

`notification_preferences`:

- user_id
- type
- in_app_enabled
- email_enabled
- browser_push_enabled
- digest_enabled

## 8. Tempo real

Quando a infraestrutura suportar, atualizar sino, contadores e listas em tempo real. Sempre manter fallback por revalidação/polling e garantir consistência ao recarregar a página.
